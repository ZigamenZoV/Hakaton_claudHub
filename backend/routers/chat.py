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


class ChatRequest(BaseModel):
    conversation_id: str = ""
    message: str
    model: str | None = None
    file_ids: list[str] = []
    user_id: str = DEFAULT_USER


def _build_messages(
    request: ChatRequest,
    memory_facts: list[str],
    rag_chunks: list[str],
    transcribed: str = "",
) -> list[dict]:
    parts: list[str] = []

    if memory_facts:
        facts = "\n".join(f"- {f}" for f in memory_facts)
        parts.append(f"Факты о пользователе из памяти:\n{facts}")

    if rag_chunks:
        ctx = "\n\n".join(rag_chunks)
        parts.append(f"Контекст из документов:\n{ctx}")

    system = "\n\n".join(parts) if parts else "Ты полезный ИИ-ассистент GPTHub."

    user_content = transcribed or request.message

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user_content},
    ]


@router.post("/completions")
async def chat_completions(request: ChatRequest) -> StreamingResponse:
    result = route(
        message=request.message,
        has_document=bool(request.file_ids),
    )

    memory_facts: list[str] = []
    rag_chunks: list[str] = []

    if request.user_id:
        mem_results = mem_svc.search(request.message, user_id=request.user_id)
        memory_facts = [r["content"] for r in mem_results]

    if result.task == TaskType.IMAGE_GEN:
        return await _image_gen_response(request.message)

    if result.task == TaskType.RAG and request.file_ids:
        rag_chunks = await rag.search(request.message, file_ids=request.file_ids)

    messages = _build_messages(request, memory_facts, rag_chunks)

    async def generate():
        full = []
        route_header = json.dumps({"task": result.task, "reason": result.reason})
        yield f"data: {{\"route\": {route_header}}}\n\n"

        async for chunk in mws_client.chat_stream(messages, model=request.model):
            full.append(chunk)
            escaped = chunk.replace('"', '\\"').replace("\n", "\\n")
            yield f'data: {{"delta": "{escaped}"}}\n\n'

        yield "data: [DONE]\n\n"

        if request.user_id and full:
            full_response = "".join(full)
            mem_svc.add(
                f"User asked: {request.message[:200]}\nAssistant: {full_response[:200]}",
                user_id=request.user_id,
            )

    return StreamingResponse(generate(), media_type="text/event-stream")


async def _image_gen_response(prompt: str) -> StreamingResponse:
    async def generate():
        try:
            url = await mws_client.generate_image(prompt)
            payload = json.dumps({"image_url": url})
            yield f"data: {payload}\n\n"
        except Exception as e:
            yield f'data: {{"error": "{e}"}}\n\n'
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")