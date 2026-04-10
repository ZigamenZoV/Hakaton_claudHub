from __future__ import annotations

import asyncio
import re
from typing import AsyncIterator

import httpx

from services.mws_client import chat_complete, chat_stream

_PLAN_PROMPT = """\
You are a research planner. Given the user query, output a JSON array of 3-5 search queries (strings only) to answer it comprehensively. Output ONLY the JSON array, no other text.

Query: {query}"""

_SYNTHESIS_PROMPT = """\
You are a research analyst. Synthesize the following sources into a comprehensive markdown report with headers, bullet points and source citations [1], [2], etc.

Query: {query}

Sources:
{sources}

Output a well-structured markdown report in the same language as the query."""


async def _fetch_url(url: str, timeout: int = 10) -> str:
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            r = await client.get(url, headers={"User-Agent": "GPTHub-Research/1.0"})
            r.raise_for_status()
            text = r.text
            text = re.sub(r"<[^>]+>", " ", text)
            text = re.sub(r"\s+", " ", text).strip()
            return text[:3000]
    except Exception:
        return ""


async def _search_web(query: str) -> list[dict]:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                "https://ddg-api.fly.dev/search",
                params={"query": query, "limit": 5},
            )
            if r.status_code == 200:
                return r.json()
    except Exception:
        pass
    return []


async def run(query: str, user_id: str = "anon") -> AsyncIterator[str]:
    yield f"data: {{'step': 'plan', 'message': 'Составляю план исследования...'}}\n\n"

    plan_raw = await chat_complete(
        [{"role": "user", "content": _PLAN_PROMPT.format(query=query)}]
    )

    import json

    try:
        searches = json.loads(plan_raw)
        if not isinstance(searches, list):
            raise ValueError
    except Exception:
        searches = [query]

    searches = searches[:5]
    sources: list[dict] = []

    for i, sq in enumerate(searches, 1):
        yield f"data: {{'step': 'search', 'message': 'Поиск {i}/{len(searches)}: {sq[:60]}'}}\n\n"
        results = await _search_web(sq)
        for res in results[:3]:
            url = res.get("url", "")
            if url:
                yield f"data: {{'step': 'fetch', 'message': 'Читаю: {url[:60]}...'}}\n\n"
                content = await _fetch_url(url)
                if content:
                    sources.append(
                        {"url": url, "title": res.get("title", url), "content": content}
                    )

    if not sources:
        yield "data: {'step': 'error', 'message': 'Не удалось найти источники'}\n\n"
        return

    yield f"data: {{'step': 'synthesize', 'message': 'Синтезирую отчёт из {len(sources)} источников...'}}\n\n"

    sources_text = "\n\n".join(
        f"[{i+1}] {s['title']}\nURL: {s['url']}\n{s['content']}"
        for i, s in enumerate(sources)
    )

    refs = "\n".join(f"[{i+1}] {s['url']}" for i, s in enumerate(sources))

    full_report = []
    async for chunk in chat_stream(
        [
            {
                "role": "user",
                "content": _SYNTHESIS_PROMPT.format(
                    query=query, sources=sources_text
                ),
            }
        ]
    ):
        full_report.append(chunk)
        escaped = chunk.replace('"', '\\"').replace("\n", "\\n")
        yield f'data: {{"step": "delta", "delta": "{escaped}"}}\n\n'

    yield f'data: {{"step": "done", "refs": {json.dumps(refs)}}}\n\n'