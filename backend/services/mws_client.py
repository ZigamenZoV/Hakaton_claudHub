from __future__ import annotations

import json
import os
from typing import AsyncIterator

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

MWS_BASE = os.getenv("MWS_BASE_URL", "https://api.gpt.mws.ru")
MWS_KEY = os.getenv("MWS_API_KEY", "sk-ewgiaPC3A6pPDYHwR8siVA")

_HEADERS = {
    "Authorization": f"Bearer {MWS_KEY}",
    "Content-Type": "application/json",
}

MODELS = {
    "llm":   os.getenv("MWS_LLM_MODEL",   "qwen2.5-72b-instruct"),
    "vlm":   os.getenv("MWS_VLM_MODEL",   "qwen2.5-vl"),
    "image": os.getenv("MWS_IMAGE_MODEL", "qwen-image-lightning"),
    "embed": os.getenv("MWS_EMBED_MODEL", "bge-m3"),
    "asr":   os.getenv("MWS_ASR_MODEL",   "whisper-medium"),
}


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
async def chat_complete(messages: list[dict], model: str | None = None) -> str:
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(
            f"{MWS_BASE}/v1/chat/completions",
            headers=_HEADERS,
            json={"model": model or MODELS["llm"], "messages": messages},
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]


async def chat_stream(
    messages: list[dict], model: str | None = None
) -> AsyncIterator[str]:
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream(
            "POST",
            f"{MWS_BASE}/v1/chat/completions",
            headers=_HEADERS,
            json={"model": model or MODELS["llm"], "messages": messages, "stream": True},
        ) as resp:
            resp.raise_for_status()
            async for raw in resp.aiter_lines():
                if not raw.startswith("data: "):
                    continue
                payload = raw[6:].strip()
                if payload == "[DONE]":
                    return
                try:
                    chunk = json.loads(payload)
                    delta = chunk["choices"][0]["delta"].get("content", "")
                    if delta:
                        yield delta
                except (json.JSONDecodeError, KeyError):
                    continue


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
async def embed(texts: list[str]) -> list[list[float]]:
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            f"{MWS_BASE}/v1/embeddings",
            headers=_HEADERS,
            json={"model": MODELS["embed"], "input": texts},
        )
        r.raise_for_status()
        data = r.json()["data"]
        return [item["embedding"] for item in sorted(data, key=lambda x: x["index"])]


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
async def generate_image(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=90) as client:
        r = await client.post(
            f"{MWS_BASE}/v1/images/generations",
            headers=_HEADERS,
            json={"model": MODELS["image"], "prompt": prompt, "n": 1},
        )
        r.raise_for_status()
        data = r.json()
        # handle both url and b64_json responses
        item = data["data"][0]
        if "url" in item:
            return item["url"]
        if "b64_json" in item:
            return f"data:image/png;base64,{item['b64_json']}"
        raise ValueError(f"unexpected image response: {data}")


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
async def transcribe_audio(audio_data: bytes, filename: str, content_type: str) -> str:
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(
            f"{MWS_BASE}/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {MWS_KEY}"},
            files={"file": (filename, audio_data, content_type)},
            data={"model": MODELS["asr"]},
        )
        r.raise_for_status()
        return r.json().get("text", "")


async def chat_with_image(
    messages: list[dict], image_url: str, model: str | None = None
) -> AsyncIterator[str]:
    vlm_messages = []
    for m in messages[:-1]:
        vlm_messages.append(m)
    last = messages[-1]
    vlm_messages.append({
        "role": "user",
        "content": [
            {"type": "image_url", "image_url": {"url": image_url}},
            {"type": "text", "text": last.get("content", "")},
        ],
    })
    async for chunk in chat_stream(vlm_messages, model=model or MODELS["vlm"]):
        yield chunk


async def list_models() -> list[dict]:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{MWS_BASE}/v1/models", headers=_HEADERS)
        r.raise_for_status()
        return r.json().get("data", [])