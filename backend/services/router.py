from __future__ import annotations

import json
import re
from dataclasses import dataclass
from enum import StrEnum


class TaskType(StrEnum):
    LLM = "llm"
    VLM = "vlm"
    ASR = "asr"
    IMAGE_GEN = "image_gen"
    RAG = "rag"
    RESEARCH = "research"


# ---------- Regex patterns for fast classification ----------
_IMAGE_GEN_RE = re.compile(
    r"(нарисуй|сгенерируй\s*(картинк|изображени|image)|создай\s*(картинк|изображени)"
    r"|draw\s|generate\s+image|imagine\s|make\s+(a\s+)?(picture|image|illustration)"
    r"|покажи\s+(картинк|изображени)|создай\s+арт|нарисуй\s+мне)",
    re.I,
)
_RESEARCH_RE = re.compile(
    r"(исследуй|изучи|найди\s+информацию|deep\s+research|проведи\s+анализ"
    r"|расскажи\s+подробно\s+о|проанализируй\s+тему|research\s+about"
    r"|сделай\s+обзор|найди\s+и\s+обобщи)",
    re.I,
)
_VLM_RE = re.compile(
    r"(что\s+на\s+(картинк|фото|изображени|скрин)|опиши\s+(картинк|фото|изображени)"
    r"|describe\s+(this\s+)?(image|picture|photo)|what\s+(is\s+)?(in|on)\s+(this|the)\s+(image|picture)"
    r"|проанализируй\s+(картинк|фото|изображени))",
    re.I,
)

# MWS model mapping per task
TASK_MODELS = {
    TaskType.LLM:       "qwen2.5-72b-instruct",
    TaskType.VLM:       "qwen2.5-vl",
    TaskType.IMAGE_GEN: "qwen-image-lightning",
    TaskType.RAG:       "qwen2.5-72b-instruct",
    TaskType.RESEARCH:  "qwen2.5-72b-instruct",
    TaskType.ASR:       "whisper-medium",
}


@dataclass(slots=True, frozen=True)
class RouteResult:
    task: TaskType
    reason: str
    model: str


def route(
    message: str,
    has_image: bool = False,
    has_audio: bool = False,
    has_document: bool = False,
) -> RouteResult:
    """Classify user message into task type using regex (fast, no LLM call).

    Priority order:
    1. Audio attachment → ASR
    2. Image attachment → VLM
    3. Document attachment → RAG
    4. Image generation keywords → IMAGE_GEN
    5. Research keywords → RESEARCH
    6. VLM keywords (without image) → LLM (fallback, since no image attached)
    7. Default → LLM
    """
    if has_audio:
        return RouteResult(TaskType.ASR, "audio attachment detected", TASK_MODELS[TaskType.ASR])

    if has_image:
        return RouteResult(TaskType.VLM, "image attachment detected", TASK_MODELS[TaskType.VLM])

    if has_document:
        return RouteResult(TaskType.RAG, "document attachment detected", TASK_MODELS[TaskType.RAG])

    if _IMAGE_GEN_RE.search(message):
        return RouteResult(TaskType.IMAGE_GEN, "image generation keyword", TASK_MODELS[TaskType.IMAGE_GEN])

    if _RESEARCH_RE.search(message):
        return RouteResult(TaskType.RESEARCH, "research keyword detected", TASK_MODELS[TaskType.RESEARCH])

    # VLM keywords without image — still route to LLM but note the intent
    if _VLM_RE.search(message):
        return RouteResult(TaskType.LLM, "image analysis keywords but no image attached", TASK_MODELS[TaskType.LLM])

    return RouteResult(TaskType.LLM, "default text", TASK_MODELS[TaskType.LLM])


async def route_with_llm(message: str) -> RouteResult:
    """Advanced classification using LLM (for ambiguous cases).
    Falls back to regex-based routing on failure.
    """
    from services.mws_client import chat_complete

    prompt = f"""Classify this user message into exactly ONE category. Output ONLY the category name.

Categories:
- llm: regular text conversation, questions, coding help
- image_gen: user wants to generate/create/draw an image
- research: user wants deep research or comprehensive analysis on a topic
- vlm: user is asking about an image (only if they mention an attached image)

Message: {message[:300]}

Category:"""

    try:
        result = await chat_complete([{"role": "user", "content": prompt}])
        category = result.strip().lower().replace('"', '').replace("'", "")

        task_map = {
            "llm": TaskType.LLM,
            "image_gen": TaskType.IMAGE_GEN,
            "research": TaskType.RESEARCH,
            "vlm": TaskType.VLM,
        }
        task = task_map.get(category, TaskType.LLM)
        return RouteResult(task, f"LLM classified as {category}", TASK_MODELS.get(task, TASK_MODELS[TaskType.LLM]))
    except Exception:
        return route(message)
