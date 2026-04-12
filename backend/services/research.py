from __future__ import annotations

import json
import re
from typing import AsyncIterator
from urllib.parse import quote_plus

import httpx

from services.mws_client import chat_complete, chat_stream

_PLAN_PROMPT = """\
Составь список из 3-4 поисковых запросов на русском языке для исследования темы.
Выведи ТОЛЬКО JSON-массив строк, без пояснений, без markdown.
Пример: ["запрос 1", "запрос 2", "запрос 3"]

Тема: {query}"""

_SYNTHESIS_PROMPT = """\
Ты — аналитик. СТРОГО отвечай ТОЛЬКО на русском языке.

На основе найденных источников напиши подробный отчёт в формате markdown.

Запрос пользователя: {query}

Источники:
{sources}

Требования:
- ТОЛЬКО русский язык, никакого китайского или английского
- Структурированный markdown с заголовками ##
- Ссылки на источники [1], [2] и т.д.
- Минимум 300 слов
- Выводы в конце"""

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

    # fallback: ручная очистка
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
    """Парсим HTML-страницу DuckDuckGo для получения реальных результатов поиска."""
    results = []

    try:
        encoded = quote_plus(query)
        url = f"https://html.duckduckgo.com/html/?q={encoded}&kl=ru-ru"

        async with httpx.AsyncClient(**_CLIENT_KWARGS) as client:
            r = await client.post(
                "https://html.duckduckgo.com/html/",
                data={"q": query, "kl": "ru-ru"},
                headers={**_HEADERS, "Content-Type": "application/x-www-form-urlencoded"},
            )
            html = r.text

        # Парсим результаты из HTML
        # DDG возвращает ссылки в виде //duckduckgo.com/l/?uddg=<encoded_url>
        snippet_blocks = re.findall(
            r'class="result__body".*?class="result__snippet"[^>]*>(.*?)</a>',
            html, re.S
        )
        url_blocks = re.findall(
            r'class="result__url"[^>]*>\s*(.*?)\s*</a>',
            html, re.S
        )
        title_blocks = re.findall(
            r'class="result__a"[^>]*>(.*?)</a>',
            html, re.S
        )

        # Чистим от HTML тегов
        def clean(s: str) -> str:
            return re.sub(r"<[^>]+>", "", s).strip()

        for i in range(min(len(title_blocks), len(url_blocks), 8)):
            title = clean(title_blocks[i])
            raw_url = clean(url_blocks[i])
            snippet = clean(snippet_blocks[i]) if i < len(snippet_blocks) else ""

            # Восстанавливаем полный URL если нужно
            if not raw_url.startswith("http"):
                raw_url = "https://" + raw_url

            if title and raw_url:
                results.append({
                    "url": raw_url,
                    "title": title[:100],
                    "snippet": snippet[:200],
                })

    except Exception:
        pass

    # Fallback: пробуем через обычный GET запрос
    if not results:
        try:
            encoded = quote_plus(query)
            async with httpx.AsyncClient(**_CLIENT_KWARGS) as client:
                r = await client.get(
                    f"https://html.duckduckgo.com/html/?q={encoded}&kl=ru-ru",
                    headers=_HEADERS,
                )
                html = r.text

            title_blocks = re.findall(r'class="result__a"[^>]*>(.*?)</a>', html, re.S)
            url_blocks = re.findall(r'class="result__url"[^>]*>\s*(.*?)\s*</a>', html, re.S)

            def clean(s: str) -> str:
                return re.sub(r"<[^>]+>", "", s).strip()

            for i in range(min(len(title_blocks), len(url_blocks), 8)):
                title = clean(title_blocks[i])
                raw_url = clean(url_blocks[i])
                if not raw_url.startswith("http"):
                    raw_url = "https://" + raw_url
                if title and raw_url:
                    results.append({"url": raw_url, "title": title[:100], "snippet": ""})
        except Exception:
            pass

    return results


async def run(query: str, user_id: str = "default") -> AsyncIterator[str]:
    def _sse(step: str, **kwargs) -> str:
        return f"data: {json.dumps({'step': step, **kwargs}, ensure_ascii=False)}\n\n"

    yield _sse("plan", message="Составляю план исследования...")

    # Генерируем поисковые запросы
    plan_raw = await chat_complete(
        [{"role": "user", "content": _PLAN_PROMPT.format(query=query)}],
        model="mws-gpt-alpha",  # быстрая модель для планирования
    )
    try:
        clean = re.sub(r"```json|```", "", plan_raw).strip()
        searches = json.loads(clean)
        if not isinstance(searches, list):
            raise ValueError
        searches = [s for s in searches if isinstance(s, str)]
    except Exception:
        searches = [query]

    searches = searches[:4]
    sources: list[dict] = []

    for i, sq in enumerate(searches, 1):
        yield _sse("search", message=f"Поиск {i}/{len(searches)}: {sq[:60]}")
        results = await _ddg_search(sq)

        if not results:
            yield _sse("search", message=f"Поиск {i}/{len(searches)}: результатов не найдено, пропускаю")
            continue

        for res in results[:2]:
            url = res.get("url", "")
            if not url or any(s["url"] == url for s in sources):
                continue
            # Пропускаем нежелательные домены
            if any(skip in url for skip in ["duckduckgo.com", "duck.com"]):
                continue

            yield _sse("fetch", message=f"Читаю: {url[:70]}...")
            content = await fetch_url(url)
            if content and len(content) > 100:
                sources.append({
                    "url": url,
                    "title": res.get("title", url),
                    "snippet": res.get("snippet", ""),
                    "content": content,
                })
                if len(sources) >= 6:  # максимум 6 источников
                    break

        if len(sources) >= 6:
            break

    if not sources:
        yield _sse("error", message="Не удалось найти источники — отвечаю из знаний модели")
        async for chunk in chat_stream(
            [{"role": "user", "content": f"Ответь подробно на русском языке: {query}"}]
        ):
            yield _sse("delta", delta=chunk)
        yield _sse("done", refs="")
        return

    yield _sse("synthesize", message=f"Синтезирую отчёт из {len(sources)} источников...")

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