from __future__ import annotations

import json
import uuid
from typing import Annotated

import httpx
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services import memory as mem_svc
from services import mws_client, rag
from services.router import TaskType, route

router = APIRouter(prefix="/api/chat", tags=["chat"])

WHISPER_URL = "http://whisper:8000/transcribe"
DEFAULT_USER = "default"

SYSTEM_PROMPT = """\
Ты — GPTHub, умный ИИ-ассистент. 
 
КРИТИЧЕСКИ ВАЖНО: Всегда отвечай ТОЛЬКО на русском языке, независимо от языка документов, \
файлов или контекста. Даже если пользователь прислал файл на другом языке — отвечай по-русски.
 
Правила:
- Отвечай точно, полезно и дружелюбно
- Используй markdown для форматирования когда уместно
- При анализе файлов — пересказывай содержимое на русском
- При генерации изображений — подтверди что начал генерацию
- При анализе изображений — описывай подробно что видишь"""


class ChatRequest(BaseModel):
    conversation_id: str = ""
    message: str
    model: str | None = None
    file_ids: list[str] = []
    image_url: str | None = None  # base64 or URL of attached image
    user_id: str = DEFAULT_USER


def _build_messages(
    request: ChatRequest,
    memory_facts: list[str],
    rag_chunks: list[str],
    transcribed: str = "",
) -> list[dict]:
    parts: list[str] = [SYSTEM_PROMPT]

    if memory_facts:
        facts = "\n".join(f"- {f}" for f in memory_facts)
        parts.append(f"\n📝 Факты о пользователе из долговременной памяти:\n{facts}")

    if rag_chunks:
        ctx = "\n\n".join(rag_chunks)
        parts.append(f"\n📄 Контекст из загруженных документов:\n{ctx}")

    system = "\n".join(parts)
    user_content = transcribed or request.message

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user_content},
    ]


@router.post("/completions")
async def chat_completions(request: ChatRequest) -> StreamingResponse:
    result = route(
        message=request.message,
        has_image=bool(request.image_url),
        has_document=bool(request.file_ids),
    )

    # --- Memory retrieval ---
    memory_facts: list[str] = []
    if request.user_id:
        mem_results = await mem_svc.search(request.message, user_id=request.user_id)
        memory_facts = [r["content"] for r in mem_results]

    # --- Image generation ---
    if result.task == TaskType.IMAGE_GEN:
        return await _image_gen_response(request.message)

    # --- VLM (image analysis) ---
    if result.task == TaskType.VLM and request.image_url:
        return await _vlm_response(request, memory_facts)

    # --- RAG context ---
    rag_chunks: list[str] = []
    if request.file_ids:
        rag_chunks = await rag.search(request.message, file_ids=request.file_ids)

    messages = _build_messages(request, memory_facts, rag_chunks)

    async def generate():
        full = []
        route_header = json.dumps({"task": result.task, "reason": result.reason, "model": result.model})
        yield f"data: {{\"route\": {route_header}}}\n\n"

        async for chunk in mws_client.chat_stream(messages, model=request.model):
            full.append(chunk)
            escaped = chunk.replace('"', '\\"').replace("\n", "\\n")
            yield f'data: {{"delta": "{escaped}"}}\n\n'

        yield "data: [DONE]\n\n"

        # --- Save facts to memory (async, non-blocking) ---
        if request.user_id and full:
            full_response = "".join(full)
            try:
                await mem_svc.extract_and_save(
                    request.message, full_response, user_id=request.user_id,
                )
            except Exception:
                pass  # Don't break chat if memory fails

    return StreamingResponse(generate(), media_type="text/event-stream")


async def _vlm_response(request: ChatRequest, memory_facts: list[str]) -> StreamingResponse:
    """Handle image analysis via VLM model."""
    async def generate():
        route_header = json.dumps({"task": "vlm", "reason": "image attachment", "model": mws_client.MODELS["vlm"]})
        yield f"data: {{\"route\": {route_header}}}\n\n"

        full = []
        async for chunk in mws_client.chat_with_image(
            [{"role": "user", "content": request.message or "Опиши это изображение подробно."}],
            image_url=request.image_url,
        ):
            full.append(chunk)
            escaped = chunk.replace('"', '\\"').replace("\n", "\\n")
            yield f'data: {{"delta": "{escaped}"}}\n\n'

        yield "data: [DONE]\n\n"

        if request.user_id and full:
            try:
                await mem_svc.extract_and_save(
                    request.message, "".join(full), user_id=request.user_id,
                )
            except Exception:
                pass

    return StreamingResponse(generate(), media_type="text/event-stream")


async def _image_gen_response(prompt: str) -> StreamingResponse:
    async def generate():
        route_header = json.dumps({"task": "image_gen", "reason": "image generation keyword", "model": mws_client.MODELS["image"]})
        yield f"data: {{\"route\": {route_header}}}\n\n"
        try:
            url = await mws_client.generate_image(prompt)
            payload = json.dumps({"image_url": url})
            yield f"data: {payload}\n\n"
        except Exception as e:
            yield f'data: {{"error": "{e}"}}\n\n'
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
