from __future__ import annotations

import json
import re
from typing import Any, AsyncIterator

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services import memory as mem_svc
from services import mws_client, rag
from services.router import TaskType, route

router = APIRouter(prefix="/v1", tags=["openai-compat"])

DEFAULT_USER = "default"
_URL_RE = re.compile(r"https?://\S+")

SYSTEM_PROMPT = """\
Ты — GPTHub, умный ИИ-ассистент.

ВАЖНО: Всегда отвечай ТОЛЬКО на русском языке. Даже если документ, файл или контекст \
на другом языке — всё равно отвечай по-русски. Никогда не используй китайский, \
английский или любой другой язык в ответах.

Правила:
- Отвечай точно, полезно и дружелюбно
- Используй markdown для форматирования когда уместно
- При анализе файлов — пересказывай содержимое на русском языке
- При генерации изображений — подтверди что начал генерацию
- При анализе изображений — описывай подробно что видишь на русском"""


class OAIMessage(BaseModel):
    role: str
    content: Any  # str or list of content parts


class OAIChatRequest(BaseModel):
    model: str = "qwen2.5-72b-instruct"
    messages: list[OAIMessage]
    stream: bool = False
    user: str = DEFAULT_USER


def _extract_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return " ".join(
            p.get("text", "") for p in content if isinstance(p, dict) and p.get("type") == "text"
        )
    return str(content)


def _has_image(messages: list[OAIMessage]) -> bool:
    for m in messages:
        if isinstance(m.content, list):
            for part in m.content:
                if isinstance(part, dict) and part.get("type") == "image_url":
                    return True
    return False


def _to_mws_messages(messages: list[OAIMessage]) -> list[dict]:
    result = []
    for m in messages:
        if m.role == "system":
            continue  # пропускаем system от Open WebUI, вставим свой позже
        if isinstance(m.content, str):
            result.append({"role": m.role, "content": m.content})
        elif isinstance(m.content, list):
            parts = []
            for part in m.content:
                if not isinstance(part, dict):
                    continue
                if part.get("type") == "text":
                    parts.append({"type": "text", "text": part.get("text", "")})
                elif part.get("type") == "image_url":
                    parts.append({"type": "image_url", "image_url": part.get("image_url", {})})
            result.append({"role": m.role, "content": parts})
        else:
            result.append({"role": m.role, "content": str(m.content)})
    return result

@router.get("/models")
async def list_models():
    try:
        models = await mws_client.list_models()
    except Exception:
        models = [
            {"id": "qwen2.5-72b-instruct"},
            {"id": "qwen3-vl-30b-a3b-instruct"},
            {"id": "qwen-image-lightning"},
        ]
    return {
        "object": "list",
        "data": [{"id": m["id"], "object": "model", "owned_by": "mws"} for m in models],
    }


@router.post("/chat/completions")
async def chat_completions(request: OAIChatRequest):
    user_message = _extract_text(
        next((m.content for m in reversed(request.messages) if m.role == "user"), "")
    )
    has_image = _has_image(request.messages)
    routing = route(message=user_message, has_image=has_image)

    # --- Memory retrieval ---
    mem_results = await mem_svc.search(user_message, user_id=request.user)
    memory_facts = [r["content"] for r in mem_results]

    # --- RAG retrieval ---
    rag_chunks: list[str] = []
    if not has_image and routing.task not in (TaskType.IMAGE_GEN,):
        try:
            rag_chunks = await rag.search(user_message)
        except Exception:
            pass

    messages = _to_mws_messages(request.messages)

    # --- Inject memory + RAG into system prompt ---
    injection_parts: list[str] = []
    if memory_facts:
        facts = "\n".join(f"- {f}" for f in memory_facts)
        injection_parts.append(f"📝 Факты о пользователе из долговременной памяти:\n{facts}")
    if rag_chunks:
        ctx = "\n\n".join(rag_chunks[:3])
        injection_parts.append(f"📄 Контекст из загруженных документов (перескажи на русском):\n{ctx}")

    if injection_parts:
        injection = "\n\n".join(injection_parts)
        if messages and messages[0]["role"] == "system":
            messages[0]["content"] += f"\n\n{injection}"
        else:
            messages.insert(0, {"role": "system", "content": f"{SYSTEM_PROMPT}\n\n{injection}"})
    elif not messages or messages[0]["role"] != "system":
        messages.insert(0, {"role": "system", "content": SYSTEM_PROMPT})

    # --- Image generation ---
    is_image_model = "image" in request.model.lower()
    if routing.task == TaskType.IMAGE_GEN or is_image_model:
        return await _image_gen_oai(user_message, request.stream)
    
    # --- Deep Research ---
    if routing.task == TaskType.RESEARCH:
        return StreamingResponse(
            _research_oai(user_message, request.user),
            media_type="text/event-stream",
        )

    model = routing.model if has_image else request.model

    # --- URL fetching: auto-inject page content when user sends a link ---
    url_match = _URL_RE.search(user_message)
    if url_match:
        from services.research import fetch_url
        page_content = await fetch_url(url_match.group(0))
        if page_content and messages and messages[-1]["role"] == "user":
            if isinstance(messages[-1]["content"], str):
                messages[-1]["content"] += (
                    f"\n\nСодержимое страницы {url_match.group(0)}:\n{page_content[:2000]}"
                )

    if request.stream:
        return StreamingResponse(
            _stream_oai(messages, model, request.user, user_message),
            media_type="text/event-stream",
        )

    content = await mws_client.chat_complete(messages, model=model)

    try:
        await mem_svc.extract_and_save(user_message, content, user_id=request.user)
    except Exception:
        pass

    return {
        "id": "chatcmpl-gpthub",
        "object": "chat.completion",
        "model": model,
        "choices": [
            {"index": 0, "message": {"role": "assistant", "content": content}, "finish_reason": "stop"}
        ],
        "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
    }


async def _stream_oai(
    messages: list[dict], model: str, user_id: str, user_message: str
) -> AsyncIterator[str]:
    full: list[str] = []
    yield _oai_chunk(model, role="assistant")
    async for delta in mws_client.chat_stream(messages, model=model):
        full.append(delta)
        yield _oai_chunk(model, content=delta)
    yield _oai_chunk(model, finish_reason="stop")
    yield "data: [DONE]\n\n"

    if full:
        try:
            await mem_svc.extract_and_save(
                user_message, "".join(full), user_id=user_id,
            )
        except Exception:
            pass


def _oai_chunk(
    model: str,
    content: str = "",
    role: str | None = None,
    finish_reason: str | None = None,
) -> str:
    delta: dict = {}
    if role:
        delta["role"] = role
    if content:
        delta["content"] = content
    payload = {
        "id": "chatcmpl-gpthub",
        "object": "chat.completion.chunk",
        "model": model,
        "choices": [{"index": 0, "delta": delta, "finish_reason": finish_reason}],
    }
    return f"data: {json.dumps(payload)}\n\n"


async def _image_gen_oai(prompt: str, stream: bool):
    try:
        url = await mws_client.generate_image(prompt)
        content = f"![Generated image]({url})"
    except Exception as e:
        content = f"Ошибка генерации изображения: {e}"

    if stream:
        async def gen():
            yield _oai_chunk("qwen-image-lightning", role="assistant")
            yield _oai_chunk("qwen-image-lightning", content=content)
            yield _oai_chunk("qwen-image-lightning", finish_reason="stop")
            yield "data: [DONE]\n\n"
        return StreamingResponse(gen(), media_type="text/event-stream")

    return {
        "id": "chatcmpl-gpthub",
        "object": "chat.completion",
        "model": "qwen-image-lightning",
        "choices": [
            {"index": 0, "message": {"role": "assistant", "content": content}, "finish_reason": "stop"}
        ],
    }


async def _research_oai(query: str, user_id: str) -> AsyncIterator[str]:
    """Оборачивает research SSE в формат OpenAI stream для Open WebUI."""
    from services.research import run as research_run

    model = "QwQ-32B"
    yield _oai_chunk(model, role="assistant")

    # Стартовое сообщение
    yield _oai_chunk(model, content="🔍 **Запускаю Deep Research...**\n\n")

    full_text = []
    refs = ""

    async for raw in research_run(query, user_id=user_id):
        # raw это "data: {...}\n\n"
        if not raw.startswith("data: "):
            continue
        try:
            payload = json.loads(raw[6:].strip())
        except Exception:
            continue

        step = payload.get("step", "")

        if step == "plan":
            chunk = f"📋 {payload.get('message', '')}\n"
            full_text.append(chunk)
            yield _oai_chunk(model, content=chunk)

        elif step == "search":
            chunk = f"🔎 {payload.get('message', '')}\n"
            full_text.append(chunk)
            yield _oai_chunk(model, content=chunk)

        elif step == "fetch":
            chunk = f"📄 {payload.get('message', '')}\n"
            full_text.append(chunk)
            yield _oai_chunk(model, content=chunk)

        elif step == "synthesize":
            chunk = f"\n✍️ {payload.get('message', '')}\n\n"
            full_text.append(chunk)
            yield _oai_chunk(model, content=chunk)

        elif step == "delta":
            delta = payload.get("delta", "")
            full_text.append(delta)
            yield _oai_chunk(model, content=delta)

        elif step == "done":
            refs = payload.get("refs", "")
            if refs:
                chunk = f"\n\n---\n**Источники:**\n{refs}"
                full_text.append(chunk)
                yield _oai_chunk(model, content=chunk)

        elif step == "error":
            chunk = f"\n⚠️ {payload.get('message', '')}\n"
            full_text.append(chunk)
            yield _oai_chunk(model, content=chunk)

    yield _oai_chunk(model, finish_reason="stop")
    yield "data: [DONE]\n\n"

    # Сохраняем в память
    if full_text:
        try:
            from services import memory as mem_svc
            await mem_svc.extract_and_save(query, "".join(full_text), user_id=user_id)
        except Exception:
            pass