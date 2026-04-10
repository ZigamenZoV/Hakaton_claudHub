from __future__ import annotations

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


_IMAGE_GEN_RE = re.compile(
    r"(нарисуй|сгенерируй\s*(картинк|изображени|image)|создай\s*(картинк|изображени)|draw|generate\s+image|imagine\s)",
    re.I,
)
_RESEARCH_RE = re.compile(
    r"(исследуй|изучи|найди\s+информацию|deep\s+research|проведи\s+анализ|расскажи\s+подробно\s+о)",
    re.I,
)
_URL_RE = re.compile(r"https?://\S+")

# MWS model mapping per task
TASK_MODELS = {
    TaskType.LLM:       "qwen2.5-72b-instruct",
    TaskType.VLM:       "qwen2.5-vl",
    TaskType.IMAGE_GEN: "qwen-image-lightning",
    TaskType.RAG:       "qwen2.5-72b-instruct",
    TaskType.RESEARCH:  "qwen2.5-72b-instruct",
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
    if has_audio:
        return RouteResult(TaskType.ASR, "audio attachment detected", "whisper-medium")
    if has_image:
        return RouteResult(TaskType.VLM, "image attachment detected", TASK_MODELS[TaskType.VLM])
    if has_document:
        return RouteResult(TaskType.RAG, "document attachment detected", TASK_MODELS[TaskType.RAG])
    if _IMAGE_GEN_RE.search(message):
        return RouteResult(TaskType.IMAGE_GEN, "image generation keyword", TASK_MODELS[TaskType.IMAGE_GEN])
    if _RESEARCH_RE.search(message):
        return RouteResult(TaskType.RESEARCH, "research keyword detected", TASK_MODELS[TaskType.RESEARCH])
    return RouteResult(TaskType.LLM, "default text", TASK_MODELS[TaskType.LLM])