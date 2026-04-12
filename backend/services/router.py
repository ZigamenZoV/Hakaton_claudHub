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


# ---------- Regex patterns ----------
_IMAGE_GEN_RE = re.compile(
    r"(нарисуй|сгенерируй\s*(картинк|изображени|image)|создай\s*(картинк|изображени)"
    r"|draw\s|generate\s+image|imagine\s|make\s+(a\s+)?(picture|image|illustration)"
    r"|покажи\s+(картинк|изображени)|создай\s+арт|нарисуй\s+мне)",
    re.I,
)
_RESEARCH_RE = re.compile(
    r"(исследуй|изучи|найди\s+информацию|deep\s+research|проведи\s+анализ"
    r"|расскажи\s+подробно\s+о|проанализируй\s+тему|research\s+about"
    r"|сделай\s+обзор|найди\s+и\s+обобщи|что\s+такое\s+.{5,}|обзор\s+на\s+тему)",
    re.I,
)
_VLM_RE = re.compile(
    r"(что\s+на\s+(картинк|фото|изображени|скрин)|опиши\s+(картинк|фото|изображени)"
    r"|describe\s+(this\s+)?(image|picture|photo)|what\s+(is\s+)?(in|on)\s+(this|the)\s+(image|picture)"
    r"|проанализируй\s+(картинк|фото|изображени))",
    re.I,
)
_CODE_RE = re.compile(
    r"(напиши\s+код|write\s+code|implement|debug|баг|bug|функци[юя]|алгоритм"
    r"|python|typescript|javascript|react|sql\s+запрос)",
    re.I,
)

# Модели по задаче
TASK_MODELS = {
    TaskType.LLM:       "qwen2.5-72b-instruct",
    TaskType.VLM:       "qwen3-vl-30b-a3b-instruct",
    TaskType.IMAGE_GEN: "qwen-image-lightning",
    TaskType.RAG:       "qwen2.5-72b-instruct",
    TaskType.RESEARCH:  "QwQ-32B",
    TaskType.ASR:       "whisper-medium",
}

# Быстрая модель для простых задач
FAST_MODEL = "mws-gpt-alpha"


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
    """Классифицирует сообщение в тип задачи через regex (без LLM-вызова).

    Приоритет:
    1. Аудио → ASR
    2. Изображение → VLM
    3. Документ → RAG
    4. Ключевые слова генерации → IMAGE_GEN
    5. Ключевые слова research → RESEARCH
    6. Короткое сообщение (<60 символов) → LLM fast (mws-gpt-alpha)
    7. По умолчанию → LLM
    """
    if has_audio:
        return RouteResult(TaskType.ASR, "audio attachment", TASK_MODELS[TaskType.ASR])

    if has_image:
        return RouteResult(TaskType.VLM, "image attachment", TASK_MODELS[TaskType.VLM])

    if has_document:
        return RouteResult(TaskType.RAG, "document attachment", TASK_MODELS[TaskType.RAG])

    if _IMAGE_GEN_RE.search(message):
        return RouteResult(TaskType.IMAGE_GEN, "image generation keyword", TASK_MODELS[TaskType.IMAGE_GEN])

    if _RESEARCH_RE.search(message):
        return RouteResult(TaskType.RESEARCH, "research keyword", TASK_MODELS[TaskType.RESEARCH])

    if _VLM_RE.search(message):
        # VLM-слова без картинки — отвечаем текстом
        return RouteResult(TaskType.LLM, "vlm keywords but no image", TASK_MODELS[TaskType.LLM])

    # Короткие простые запросы → быстрая модель
    if len(message.strip()) < 60:
        return RouteResult(TaskType.LLM, "short message → fast model", FAST_MODEL)

    return RouteResult(TaskType.LLM, "default text", TASK_MODELS[TaskType.LLM])


async def route_with_llm(message: str) -> RouteResult:
    """Расширенная классификация через LLM для неоднозначных случаев."""
    from services.mws_client import chat_complete

    prompt = f"""Classify this user message into exactly ONE category. Output ONLY the category name, nothing else.

Categories:
- llm: regular text conversation, questions, coding help
- image_gen: user wants to generate/create/draw an image
- research: user wants deep research or comprehensive analysis on a topic
- vlm: user is asking about an image (only if they mention an attached image)

Message: {message[:300]}

Category:"""

    try:
        result = await chat_complete(
            [{"role": "user", "content": prompt}],
            model="mws-gpt-alpha",  # быстрая модель для классификации
        )
        category = result.strip().lower().replace('"', "").replace("'", "")

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