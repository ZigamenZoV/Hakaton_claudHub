# GPTHub — мультимодальный AI-ассистент

Платформа с поддержкой текста, изображений, голоса, документов (RAG), долгосрочной памяти и Deep Research.

**Стек:** FastAPI + MWS GPT API + ChromaDB + Qdrant + Open WebUI + React

---

## Архитектура

```
┌─────────────┐     ┌─────────────┐
│  Open WebUI │     │React Frontend│
│  :3000      │     │  :5173       │
└──────┬──────┘     └──────┬───────┘
       │ /v1/*             │ /api/*
       └────────┬──────────┘
                ▼
        ┌───────────────┐
        │   Backend     │  FastAPI :8000
        │   (router)    │  маршрутизация по типу задачи
        └───┬───┬───┬───┘
            │   │   │
    ┌───────┘   │   └────────┐
    ▼           ▼            ▼
┌────────┐ ┌────────┐ ┌──────────┐
│MWS API │ │ChromaDB│ │  Qdrant  │
│(LLM,   │ │  :8000 │ │  :6333   │
│VLM,ASR,│ └────────┘ └──────────┘
│Image,  │
│Embed)  │  ┌────────┐ ┌────────┐ ┌────────┐
└────────┘  │Whisper │ │  VLM   │ │ SD API │
            │  :8100 │ │  :8003 │ │  :8002 │
            └────────┘ └────────┘ └────────┘
            локальные fallback-сервисы (Docker)
```

**Маршрутизация запросов (router):**
- Короткие сообщения → `mws-gpt-alpha` (быстрая модель)
- Текстовые запросы → `qwen2.5-72b-instruct`
- Изображения → `qwen3-vl-30b-a3b-instruct` (VLM)
- Генерация картинок → `qwen-image-lightning`
- Документы → RAG (bge-m3 + ChromaDB)
- Deep Research → `QwQ-32B` + DuckDuckGo + trafilatura
- Голос → `whisper-medium` (MWS API или локальный)

---

## Быстрый старт

```bash
# 1. Клонировать репозиторий
git clone <repo-url> && cd hakaton

# 2. Настроить переменные окружения
cp .env.example .env
# Отредактировать .env при необходимости (API-ключ уже указан)

# 3. Запустить все сервисы
docker compose up -d --build

# 4. Открыть в браузере
# Open WebUI:       http://localhost:3000
# Backend API:      http://localhost:8000
# Backend health:   http://localhost:8000/health
```

Первый запуск: ChromaDB и Qdrant стартуют за ~10 сек, Whisper ~30 сек, VLM ~2 мин, SD ~3 мин.

---

## Сервисы

| Сервис      | Docker-имя  | Порт (хост) | Назначение                              |
|-------------|-------------|--------------|------------------------------------------|
| backend     | backend     | 8000         | FastAPI: роутинг, чат, RAG, память       |
| open-webui  | open-webui  | 3000         | UI (OpenAI-совместимый интерфейс)        |
| chromadb    | chromadb    | 8200         | Vector store для RAG и памяти            |
| qdrant      | qdrant      | 6333         | Дополнительный vector store              |
| whisper     | whisper     | 8100         | Локальный STT (faster-whisper)           |
| vlm         | vlm         | —            | Локальный VLM (moondream2), fallback     |
| sd_api      | sd_api      | —            | Локальная генерация изображений (SD 1.5) |

Все сервисы в сети `hakaton`, общаются по Docker DNS.

---

## API-эндпоинты

### OpenAI-совместимый (для Open WebUI)
- `POST /v1/chat/completions` — стриминг чата (SSE)
- `GET /v1/models` — список моделей

### Кастомный API (для React-фронтенда)
- `POST /api/chat/completions` — стриминг чата (SSE)
- `POST /api/voice/transcribe` — распознавание речи
- `POST /api/files/upload` — загрузка документов (PDF, DOCX, PPTX)
- `GET /api/memory?query=...` — поиск по памяти
- `POST /api/memory` — добавить запись
- `DELETE /api/memory/:id` — удалить запись
- `POST /api/images/generate` — генерация изображений
- `POST /api/export/pptx` — экспорт в презентацию
- `POST /api/research` — Deep Research (SSE)
- `GET /api/web/fetch?url=...` — извлечение текста с URL
- `GET /api/models` — список моделей
- `GET /health` — healthcheck

---

## Тесты

```bash
cd backend
py tests/test_logic.py
```

17 офлайн-тестов (без Docker, без сети): маршрутизация, chunking, полнота моделей.

---

## Переменные окружения

См. `.env.example` — все переменные с комментариями.

Ключевые:
- `MWS_API_KEY` — ключ MWS GPT API
- `USE_MWS_ASR=true` — ASR через MWS (false = локальный Whisper)
- `WHISPER_MODEL` — размер модели Whisper (small по умолчанию)

---

## Структура проекта

```
hakaton/
├── docker-compose.yml         # оркестрация всех сервисов
├── .env.example               # переменные окружения с комментариями
├── backend/
│   ├── main.py                # FastAPI app + роутеры
│   ├── routers/               # API-эндпоинты (chat, voice, files, memory, ...)
│   ├── services/              # бизнес-логика (router, mws_client, rag, memory, research)
│   ├── tests/                 # офлайн-тесты
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                  # React + Vite + Tailwind
│   ├── src/
│   └── package.json
├── whisper/                   # faster-whisper микросервис
├── services/
│   ├── vlm/                   # moondream2 VLM микросервис
│   └── sd_api/                # Stable Diffusion 1.5 микросервис
├── chroma_data/               # ChromaDB persistent (gitignore)
└── open_webui_data/           # Open WebUI данные (gitignore)
```
