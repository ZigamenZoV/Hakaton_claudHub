from __future__ import annotations

import json
from typing import AsyncIterator

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services import memory as mem_svc
from services import mws_client, rag
from services.router import TaskType, route

router = APIRouter(prefix="/v1", tags=["openai-compat"])

DEFAULT_USER = "default"


class OAIMessage(BaseModel):
    role: str
    content: str


class OAIChatRequest(BaseModel):
    model: str = "mws-gpt-alpha"
    messages: list[OAIMessage]
    stream: bool = False
    user: str = DEFAULT_USER


@router.get("/models")
async def list_models():
    try:
        models = await mws_client.list_models()
    except Exception:
        models = [{"id": "mws-gpt-alpha"}, {"id": "kodify-2.0"}, {"id": "cotype-preview-32k"}]
    return {
        "object": "list",
        "data": [
            {"id": m["id"], "object": "model", "owned_by": "mws"}
            for m in models
        ],
    }


@router.post("/chat/completions")
async def chat_completions(request: OAIChatRequest):
    user_message = next(
        (m.content for m in reversed(request.messages) if m.role == "user"), ""
    )

    routing = route(message=user_message)

    mem_results = mem_svc.search(user_message, user_id=request.user)
    memory_facts = [r["content"] for r in mem_results]

    messages = [m.model_dump() for m in request.messages]

    if memory_facts:
        facts = "\n".join(f"- {f}" for f in memory_facts)
        system_injection = f"Факты о пользователе из памяти:\n{facts}"
        if messages and messages[0]["role"] == "system":
            messages[0]["content"] += f"\n\n{system_injection}"
        else:
            messages.insert(0, {"role": "system", "content": system_injection})

    if routing.task == TaskType.IMAGE_GEN:
        return await _image_gen_oai(user_message, request.stream)

    if request.stream:
        return StreamingResponse(
            _stream_oai(messages, request.model, request.user, user_message),
            media_type="text/event-stream",
        )

    content = await mws_client.chat_complete(messages, model=request.model)

    mem_svc.add(
        f"User: {user_message[:200]}\nAssistant: {content[:200]}",
        user_id=request.user,
    )

    return {
        "id": "chatcmpl-gpthub",
        "object": "chat.completion",
        "model": request.model,
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": content},
                "finish_reason": "stop",
            }
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
        mem_svc.add(
            f"User: {user_message[:200]}\nAssistant: {''.join(full)[:200]}",
            user_id=user_id,
        )


def _oai_chunk(model: str, content: str = "", role: str | None = None, finish_reason: str | None = None) -> str:
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
            yield _oai_chunk("mws-gpt-alpha", role="assistant")
            yield _oai_chunk("mws-gpt-alpha", content=content)
            yield _oai_chunk("mws-gpt-alpha", finish_reason="stop")
            yield "data: [DONE]\n\n"
        return StreamingResponse(gen(), media_type="text/event-stream")

    return {
        "id": "chatcmpl-gpthub",
        "object": "chat.completion",
        "model": "mws-gpt-alpha",
        "choices": [
            {"index": 0, "message": {"role": "assistant", "content": content}, "finish_reason": "stop"}
        ],
    }