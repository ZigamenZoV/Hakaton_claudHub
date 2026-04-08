"""Smoke-test ChromaDB HTTP service.

Run after `docker compose up -d chromadb`:
    python scripts/test_chromadb.py
"""
import sys

import chromadb

HOST = "localhost"
PORT = 8200  # host-exposed port; inside docker network use http://chromadb:8000


def main() -> int:
    client = chromadb.HttpClient(host=HOST, port=PORT)
    print("heartbeat:", client.heartbeat())

    coll = client.get_or_create_collection("smoke_test")
    coll.upsert(
        ids=["a", "b", "c"],
        documents=[
            "Пользователь любит кофе без сахара",
            "Встреча с командой в понедельник в 10:00",
            "Faster-whisper развёрнут в отдельном контейнере",
        ],
        metadatas=[{"kind": "pref"}, {"kind": "event"}, {"kind": "infra"}],
    )

    res = coll.query(query_texts=["когда встреча"], n_results=2)
    print("query result:", res)

    assert res["ids"][0], "expected at least one match"
    print("OK: ChromaDB up, collection writes & queries work")
    return 0


if __name__ == "__main__":
    sys.exit(main())
