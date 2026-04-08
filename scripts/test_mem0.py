"""Smoke-test Mem0 with ChromaDB + Ollama.

Prereqs:
    - docker compose up -d chromadb
    - Ollama running with `nomic-embed-text` pulled (ask ML-1 if missing)
    - pip install mem0ai chromadb

Run:
    python scripts/test_mem0.py
"""
import sys

from mem0 import Memory

from mem0_config import MEM0_CONFIG


def main() -> int:
    memory = Memory.from_config(MEM0_CONFIG)

    user_id = "smoke_user"

    memory.add(
        "Меня зовут Алексей, я пью кофе без сахара по утрам.",
        user_id=user_id,
    )
    memory.add(
        "Я работаю над голосовым ассистентом на хакатоне.",
        user_id=user_id,
    )

    hits = memory.search(query="что пьёт пользователь?", user_id=user_id, limit=3)
    print("search hits:")
    for h in hits.get("results", hits):
        print(" -", h)

    assert hits, "expected at least one memory back"
    print("OK: Mem0 write + search roundtrip works")
    return 0


if __name__ == "__main__":
    sys.exit(main())
