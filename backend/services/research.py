from __future__ import annotations

import json
import re
from typing import AsyncIterator

import httpx

from services.mws_client import chat_complete, chat_stream

_PLAN_PROMPT = """\
You are a research planner. Given the user query, output a JSON array of 3-5 search queries in the same language as the query. Output ONLY the JSON array, no other text.

Query: {query}"""

_SYNTHESIS_PROMPT = """\
You are a research analyst. Synthesize the following sources into a comprehensive markdown report with headers and source citations [1], [2], etc. Write in the same language as the query.

Query: {query}

Sources:
{sources}"""

_CLIENT_KWARGS = {"timeout": 15, "follow_redirects": True, "verify": False}

_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
}


def _extract_text(html: str, url: str = "") -> str:
    try:
        import trafilatura
        text = trafilatura.extract(
            html,
            include_comments=False,
            include_tables=True,
            no_fallback=False,
            url=url,
        )
        if text and len(text) > 100:
            return text[:4000]
    except Exception:
        pass

    # fallback: manual cleanup
    html = re.sub(r"<(script|style|head|nav|footer|header)[^>]*>.*?</\1>", " ", html, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", html)
    text = re.sub(r"\s+", " ", text).strip()
    return text[200:3200] if len(text) > 200 else text[:3000]


async def fetch_url(url: str) -> str:
    try:
        async with httpx.AsyncClient(**_CLIENT_KWARGS) as client:
            r = await client.get(url, headers=_HEADERS)
            r.raise_for_status()
            return _extract_text(r.text, url=url)
    except Exception:
        return ""


async def _ddg_search(query: str) -> list[dict]:
    try:
        async with httpx.AsyncClient(**_CLIENT_KWARGS) as client:
            r = await client.get(
                "https://api.duckduckgo.com/",
                params={"q": query, "format": "json", "no_html": 1, "skip_disambig": 1},
                headers={"User-Agent": "GPTHub/1.0"},
            )
            data = r.json()
            results = []
            for item in data.get("RelatedTopics", [])[:5]:
                if "FirstURL" in item and "Text" in item:
                    results.append({
                        "url": item["FirstURL"],
                        "title": item["Text"][:80],
                        "snippet": item["Text"],
                    })
            return results
    except Exception:
        return []


async def run(query: str, user_id: str = "default") -> AsyncIterator[str]:
    def _sse(step: str, **kwargs) -> str:
        return f"data: {json.dumps({'step': step, **kwargs}, ensure_ascii=False)}\n\n"

    yield _sse("plan", message="Составляю план исследования...")

    plan_raw = await chat_complete(
        [{"role": "user", "content": _PLAN_PROMPT.format(query=query)}]
    )
    try:
        clean = re.sub(r"```json|```", "", plan_raw).strip()
        searches = json.loads(clean)
        if not isinstance(searches, list):
            raise ValueError
    except Exception:
        searches = [query]

    searches = searches[:4]
    sources: list[dict] = []

    for i, sq in enumerate(searches, 1):
        yield _sse("search", message=f"Поиск {i}/{len(searches)}: {sq[:60]}")
        results = await _ddg_search(sq)
        for res in results[:2]:
            url = res.get("url", "")
            if not url or url in [s["url"] for s in sources]:
                continue
            yield _sse("fetch", message=f"Читаю: {url[:70]}...")
            content = await fetch_url(url)
            if content and len(content) > 100:
                sources.append({"url": url, "title": res.get("title", url), "content": content})

    if not sources:
        yield _sse("error", message="Не удалось найти источники, отвечаю из знаний модели")
        async for chunk in chat_stream([{"role": "user", "content": query}]):
            yield _sse("delta", delta=chunk)
        yield _sse("done", refs="")
        return

    yield _sse("synthesize", message=f"Синтезирую отчёт из {len(sources)} источн��ков...")

    sources_text = "\n\n".join(
        f"[{i+1}] {s['title']}\nURL: {s['url']}\n{s['content']}"
        for i, s in enumerate(sources)
    )
    refs = "\n".join(f"[{i+1}] {s['url']}" for i, s in enumerate(sources))

    async for chunk in chat_stream(
        [{"role": "user", "content": _SYNTHESIS_PROMPT.format(query=query, sources=sources_text)}]
    ):
        yield _sse("delta", delta=chunk)

    yield _sse("done", refs=refs)
