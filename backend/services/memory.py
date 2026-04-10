from __future__ import annotations

import os
from typing import Any

from mem0 import Memory

MWS_BASE = os.getenv("MWS_BASE_URL", "https://api.gpt.mws.ru")
MWS_KEY = os.getenv("MWS_API_KEY", "sk-ewgiaPC3A6pPDYHwR8siVA")
CHROMA_HOST = os.getenv("CHROMA_HOST", "chromadb")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", "8000"))
MEM0_COLLECTION = os.getenv("MEM0_COLLECTION", "mem0_main")
MWS_LLM_MODEL = os.getenv("MWS_LLM_MODEL", "mws-gpt-alpha")
MWS_EMBED_MODEL = os.getenv("MWS_EMBED_MODEL", "bge-m3")

_MEM0_CONFIG = {
    "vector_store": {
        "provider": "chroma",
        "config": {
            "collection_name": MEM0_COLLECTION,
            "host": CHROMA_HOST,
            "port": CHROMA_PORT,
        },
    },
    "embedder": {
        "provider": "openai",
        "config": {
            "model": MWS_EMBED_MODEL,
            "api_key": MWS_KEY,
            "openai_base_url": f"{MWS_BASE}/v1",
        },
    },
    "llm": {
        "provider": "openai",
        "config": {
            "model": MWS_LLM_MODEL,
            "api_key": MWS_KEY,
            "openai_base_url": f"{MWS_BASE}/v1",
            "temperature": 0.1,
        },
    },
}

_memory: Memory | None = None


def get_memory() -> Memory:
    global _memory
    if _memory is None:
        _memory = Memory.from_config(_MEM0_CONFIG)
    return _memory


def add(content: str, user_id: str) -> None:
    get_memory().add(content, user_id=user_id)


def search(query: str, user_id: str, limit: int = 5) -> list[dict[str, Any]]:
    result = get_memory().search(query=query, user_id=user_id, limit=limit)
    items = result.get("results", result) if isinstance(result, dict) else result
    return [
        {
            "id": str(r.get("id", "")),
            "content": r.get("memory", r.get("content", "")),
            "category": r.get("metadata", {}).get("category", "fact"),
            "createdAt": r.get("created_at", 0),
        }
        for r in items
    ]


def get_all(user_id: str) -> list[dict[str, Any]]:
    result = get_memory().get_all(user_id=user_id)
    items = result.get("results", result) if isinstance(result, dict) else result
    return [
        {
            "id": str(r.get("id", "")),
            "content": r.get("memory", r.get("content", "")),
            "category": r.get("metadata", {}).get("category", "fact"),
            "createdAt": r.get("created_at", 0),
        }
        for r in items
    ]


def delete(memory_id: str) -> None:
    get_memory().delete(memory_id=memory_id)