from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Any

import chromadb
from chromadb.config import Settings

from services.mws_client import embed

CHROMA_HOST = os.getenv("CHROMA_HOST", "chromadb")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", "8000"))
MEM0_COLLECTION = os.getenv("MEM0_COLLECTION", "mem0_main")


def _col():
    client = chromadb.HttpClient(
        host=CHROMA_HOST,
        port=CHROMA_PORT,
        settings=Settings(anonymized_telemetry=False),
    )
    return client.get_or_create_collection(MEM0_COLLECTION)


async def add(content: str, user_id: str) -> None:
    vectors = await embed([content])
    col = _col()
    col.upsert(
        ids=[str(uuid.uuid4())],
        embeddings=vectors,
        documents=[content],
        metadatas=[{
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }],
    )


async def search(query: str, user_id: str, limit: int = 5) -> list[dict[str, Any]]:
    try:
        vectors = await embed([query])
        col = _col()
        result = col.query(
            query_embeddings=vectors,
            n_results=min(limit, col.count()),
            where={"user_id": user_id},
        )
        ids = result["ids"][0]
        docs = result["documents"][0]
        metas = result["metadatas"][0]
        return [
            {
                "id": ids[i],
                "content": docs[i],
                "category": "fact",
                "createdAt": metas[i].get("created_at", ""),
            }
            for i in range(len(ids))
        ]
    except Exception:
        return []


def get_all(user_id: str) -> list[dict[str, Any]]:
    try:
        col = _col()
        result = col.get(where={"user_id": user_id})
        return [
            {
                "id": result["ids"][i],
                "content": result["documents"][i],
                "category": "fact",
                "createdAt": result["metadatas"][i].get("created_at", ""),
            }
            for i in range(len(result["ids"]))
            if result["documents"][i]
        ]
    except Exception:
        return []


def delete(memory_id: str) -> None:
    col = _col()
    col.delete(ids=[memory_id])