from __future__ import annotations

import hashlib
import os
from pathlib import Path

import chromadb
from chromadb.config import Settings

from services.mws_client import embed

CHROMA_HOST = os.getenv("CHROMA_HOST", "chromadb")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", "8000"))
RAG_COLLECTION = os.getenv("RAG_COLLECTION", "rag_docs")
CHUNK_SIZE = int(os.getenv("RAG_CHUNK_SIZE", "800"))
CHUNK_OVERLAP = int(os.getenv("RAG_CHUNK_OVERLAP", "100"))
TOP_K = int(os.getenv("RAG_TOP_K", "5"))


def _get_client() -> chromadb.HttpClient:
    return chromadb.HttpClient(
        host=CHROMA_HOST,
        port=CHROMA_PORT,
        settings=Settings(anonymized_telemetry=False),
    )


def _chunk(text: str) -> list[str]:
    chunks, start = [], 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunks.append(text[start:end])
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return [c for c in chunks if c.strip()]


async def ingest(file_id: str, text: str, metadata: dict | None = None) -> int:
    chunks = _chunk(text)
    if not chunks:
        return 0
    vectors = await embed(chunks)
    client = _get_client()
    col = client.get_or_create_collection(RAG_COLLECTION)
    ids = [
        hashlib.sha256(f"{file_id}:{i}".encode()).hexdigest()[:16]
        for i in range(len(chunks))
    ]
    col.upsert(
        ids=ids,
        embeddings=vectors,
        documents=chunks,
        metadatas=[{"file_id": file_id, **(metadata or {})} for _ in chunks],
    )
    return len(chunks)


async def search(query: str, file_ids: list[str] | None = None) -> list[str]:
    client = _get_client()
    col = client.get_or_create_collection(RAG_COLLECTION)
    vectors = await embed([query])
    where = {"file_id": {"$in": file_ids}} if file_ids else None
    kwargs: dict = {"query_embeddings": vectors, "n_results": TOP_K}
    if where:
        kwargs["where"] = where
    result = col.query(**kwargs)
    return result["documents"][0] if result["documents"] else []


def delete_file(file_id: str) -> None:
    client = _get_client()
    col = client.get_or_create_collection(RAG_COLLECTION)
    existing = col.get(where={"file_id": file_id})
    if existing["ids"]:
        col.delete(ids=existing["ids"])