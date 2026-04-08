"""Mem0 configuration.

Vector store: ChromaDB (running as `chromadb` service in docker-compose).
Embedder:     Ollama `nomic-embed-text` — shared with RAG stack owned by ML-1.
LLM:          Ollama (model pick finalized by ML-1; default = llama3.1:8b).

Import `MEM0_CONFIG` and pass to `Memory.from_config(MEM0_CONFIG)`.
"""
import os

CHROMA_HOST = os.getenv("CHROMA_HOST", "localhost")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", "8200"))

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
OLLAMA_LLM_MODEL = os.getenv("OLLAMA_LLM_MODEL", "llama3.1:8b")

MEM0_COLLECTION = os.getenv("MEM0_COLLECTION", "mem0_main")

MEM0_CONFIG = {
    "vector_store": {
        "provider": "chroma",
        "config": {
            "collection_name": MEM0_COLLECTION,
            "host": CHROMA_HOST,
            "port": CHROMA_PORT,
        },
    },
    "embedder": {
        "provider": "ollama",
        "config": {
            "model": OLLAMA_EMBED_MODEL,
            "ollama_base_url": OLLAMA_BASE_URL,
        },
    },
    "llm": {
        "provider": "ollama",
        "config": {
            "model": OLLAMA_LLM_MODEL,
            "ollama_base_url": OLLAMA_BASE_URL,
            "temperature": 0.1,
        },
    },
}
