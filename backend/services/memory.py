from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any

import chromadb
from chromadb.config import Settings

from services.mws_client import embed, chat_complete

CHROMA_HOST = os.getenv("CHROMA_HOST", "chromadb")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", "8000"))
MEM0_COLLECTION = os.getenv("MEM0_COLLECTION", "mem0_main")

# ---------- Prompt for fact extraction ----------
_FACT_EXTRACT_PROMPT = """\
Ты — модуль извлечения фактов. Из диалога ниже извлеки ключевые факты о пользователе \
(имя, предпочтения, профессия, интересы, запросы, контекст задачи).

Правила:
- Выведи JSON-массив строк, каждая строка — один факт.
- Если фактов нет — выведи пустой массив [].
- НЕ дублируй информацию, будь кратким.
- Отвечай ТОЛЬКО JSON-массивом, без пояснений.

Диалог:
Пользователь: {user_msg}
Ассистент: {assistant_msg}"""


def _col():
    client = chromadb.HttpClient(
        host=CHROMA_HOST,
        port=CHROMA_PORT,
        settings=Settings(anonymized_telemetry=False),
    )
    return client.get_or_create_collection(MEM0_COLLECTION)


async def extract_and_save(user_msg: str, assistant_msg: str, user_id: str) -> list[str]:
    """Extract facts from a conversation turn using LLM and save them to memory."""
    try:
        raw = await chat_complete(
            [{"role": "user", "content": _FACT_EXTRACT_PROMPT.format(
                user_msg=user_msg[:500],
                assistant_msg=assistant_msg[:500],
            )}],
        )
        # Parse JSON array from LLM response
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        facts = json.loads(raw)
        if not isinstance(facts, list):
            facts = [str(facts)]
        facts = [f.strip() for f in facts if isinstance(f, str) and f.strip()]
    except Exception:
        # Fallback: save a compact summary instead
        facts = [f"Пользователь спросил: {user_msg[:150]}"]

    for fact in facts:
        await add(fact, user_id=user_id)

    return facts


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
        count = col.count()
        if count == 0:
            return []
        result = col.query(
            query_embeddings=vectors,
            n_results=min(limit, count),
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
