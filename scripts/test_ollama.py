"""Smoke-test Ollama: list models, generate a short reply, measure latency.

Usage:
    python scripts/test_ollama.py
"""
import os
import time

import requests

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

MODELS_TO_TEST = [
    ("llama3:8b", "Reply with one word: OK"),
    ("mistral:7b", "Reply with one word: OK"),
]


def list_models() -> list[str]:
    r = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=10)
    r.raise_for_status()
    return [m["name"] for m in r.json().get("models", [])]


def generate(model: str, prompt: str) -> tuple[str, float]:
    t0 = time.perf_counter()
    r = requests.post(
        f"{OLLAMA_BASE_URL}/api/generate",
        json={"model": model, "prompt": prompt, "stream": False},
        timeout=120,
    )
    r.raise_for_status()
    return r.json().get("response", "").strip(), time.perf_counter() - t0


def main() -> None:
    print(f"Ollama @ {OLLAMA_BASE_URL}")
    available = list_models()
    print(f"Available models ({len(available)}): {available}")

    for model, prompt in MODELS_TO_TEST:
        if model not in available:
            print(f"[skip] {model} not pulled yet")
            continue
        try:
            text, dt = generate(model, prompt)
            print(f"[ok]   {model:20s} {dt:6.2f}s  -> {text!r}")
        except Exception as e:  # noqa: BLE001
            print(f"[fail] {model}: {e}")


if __name__ == "__main__":
    main()
