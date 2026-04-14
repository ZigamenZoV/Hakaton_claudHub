"""Offline tests for pure logic. No Docker, no network, no pip deps needed.

Tests only import from services.router which has zero external dependencies.
Chunking logic is tested inline (copy of the algorithm).
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from services.router import route, TaskType, TASK_MODELS, FAST_MODEL


# ---------- Router tests ----------

def test_route_audio():
    r = route("hello", has_audio=True)
    assert r.task == TaskType.ASR


def test_route_image():
    r = route("что это?", has_image=True)
    assert r.task == TaskType.VLM


def test_route_document():
    r = route("расскажи о содержимом", has_document=True)
    assert r.task == TaskType.RAG


def test_route_image_gen_ru():
    r = route("нарисуй мне кота в космосе")
    assert r.task == TaskType.IMAGE_GEN


def test_route_image_gen_en():
    r = route("generate image of a sunset over mountains")
    assert r.task == TaskType.IMAGE_GEN


def test_route_research():
    r = route("исследуй тему квантовых вычислений подробно")
    assert r.task == TaskType.RESEARCH


def test_route_research_overview():
    r = route("сделай обзор на тему машинного обучения")
    assert r.task == TaskType.RESEARCH


def test_route_short_message_fast():
    r = route("привет")
    assert r.task == TaskType.LLM
    assert r.model == FAST_MODEL


def test_route_long_default():
    r = route("расскажи мне подробно как работает двигатель внутреннего сгорания и какие типы существуют")
    assert r.task == TaskType.LLM
    assert r.model == TASK_MODELS[TaskType.LLM]


def test_route_vlm_no_image():
    r = route("что на картинке?")
    assert r.task == TaskType.LLM  # VLM words but no image → LLM


def test_route_priority_audio_over_image():
    r = route("что это?", has_audio=True, has_image=True)
    assert r.task == TaskType.ASR  # audio has higher priority


def test_route_priority_image_over_doc():
    r = route("расскажи", has_image=True, has_document=True)
    assert r.task == TaskType.VLM


# ---------- Chunking tests (inline algorithm) ----------

def _chunk(text: str, size: int = 800, overlap: int = 100) -> list[str]:
    """Copy of rag._chunk for offline testing."""
    chunks, start = [], 0
    while start < len(text):
        end = start + size
        chunks.append(text[start:end])
        start += size - overlap
    return [c for c in chunks if c.strip()]


def test_chunk_small():
    assert _chunk("hello world") == ["hello world"]


def test_chunk_empty():
    assert _chunk("") == []
    assert _chunk("   ") == []


def test_chunk_large():
    text = "x" * 2000
    chunks = _chunk(text)
    assert len(chunks) >= 2
    assert all(len(c) <= 800 for c in chunks)


def test_chunk_overlap():
    text = "A" * 800 + "B" * 800
    chunks = _chunk(text, size=800, overlap=100)
    assert len(chunks) >= 2
    # Second chunk should start with some A's (overlap)
    assert chunks[1].startswith("A")


# ---------- Task models completeness ----------

def test_task_models_complete():
    for t in TaskType:
        assert t in TASK_MODELS, f"Missing model for {t}"


if __name__ == "__main__":
    import traceback
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    fails = 0
    for t in tests:
        try:
            t()
            print(f"  ok   {t.__name__}")
        except Exception:
            fails += 1
            print(f"  FAIL {t.__name__}")
            traceback.print_exc()
    print(f"\n{len(tests) - fails}/{len(tests)} passed")
    sys.exit(1 if fails else 0)
