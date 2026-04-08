# Hakaton — voice + memory infra (День 1)

Инфраструктура для голосового ассистента с долговременной памятью:
`faster-whisper` (STT) + `ChromaDB` (vector store) + `Mem0` (memory layer).

## Сервисы

| Сервис    | Внутри docker-сети    | На хосте              | Назначение                  |
|-----------|-----------------------|-----------------------|-----------------------------|
| whisper   | `http://whisper:8000` | `http://localhost:8100` | STT, эндпоинт `/transcribe` |
| chromadb  | `http://chromadb:8000`| `http://localhost:8200` | Vector store для Mem0 / RAG |
| ollama    | `http://host.docker.internal:11434` | `http://localhost:11434` | Embeddings + LLM (поднимает ML-1) |

Все сервисы подключены к сети `hakaton` (см. `docker-compose.yml`). Бэкендеру
достаточно присоединить свой сервис к этой сети — и обращаться по именам выше.

## Быстрый старт

```bash
cp .env.example .env
docker compose up -d --build
```

Первый билд whisper ~5–10 мин (CTranslate2 + ffmpeg). Модель (`small` по
умолчанию) качается при первом запросе к `/transcribe` и кэшируется в
`./whisper_cache`.

### Проверка whisper

```bash
curl -F "file=@sample.wav" http://localhost:8100/transcribe
curl http://localhost:8100/health
```

Ответ `/transcribe`:
```json
{
  "text": "...",
  "language": "ru",
  "language_probability": 0.99,
  "duration": 3.2,
  "segments": [{"start": 0.0, "end": 1.4, "text": "..."}]
}
```

Параметры формы: `file` (обязательно), `language` (опц., ISO код),
`vad_filter` (bool, по умолчанию `true`).

### Проверка ChromaDB

```bash
pip install -r requirements-dev.txt
python scripts/test_chromadb.py
```

### Проверка Mem0

Требует, чтобы Ollama был запущен и модель `nomic-embed-text` была загружена
(это отвечает ML-1):

```bash
ollama pull nomic-embed-text   # если ещё не
python scripts/test_mem0.py
```

Конфиг Mem0 — в `mem0_config.py`. Берёт ChromaDB как vector store и Ollama
(`nomic-embed-text`) как embedder. LLM по умолчанию — `llama3.1:8b`,
переопределяется через `OLLAMA_LLM_MODEL`.

## Выбор модели Whisper

| Модель   | RAM  | Качество ru | Скорость (CPU int8) |
|----------|------|-------------|---------------------|
| tiny     | ~1GB | низкое      | очень быстро        |
| base     | ~1GB | среднее     | быстро              |
| **small**| ~2GB | хорошее     | приемлемо (дефолт)  |
| medium   | ~5GB | очень хор.  | медленно на CPU     |
| large-v3 | ~10GB| лучшее      | только с GPU        |

Переключить: `WHISPER_MODEL=medium docker compose up -d`.

## Структура репо

```
hakaton/
├── docker-compose.yml          # whisper + chromadb в общей сети hakaton
├── .env.example
├── whisper/
│   ├── Dockerfile              # python:3.11-slim + ffmpeg + faster-whisper
│   ├── requirements.txt
│   └── app.py                  # FastAPI: POST /transcribe, GET /health
├── mem0_config.py              # Mem0 ← ChromaDB + Ollama nomic-embed-text
├── scripts/
│   ├── test_chromadb.py
│   └── test_mem0.py
├── requirements-dev.txt        # chromadb, mem0ai, requests
├── chroma_data/                # persistent volume (gitignore)
└── whisper_cache/              # HF cache для моделей (gitignore)
```

## Согласования с командой

- **Бэкенд:** имена сервисов `whisper`, `chromadb`, сеть `hakaton`. Хост-порты
  `8100` / `8200` (чтобы не конфликтовать с типовыми `8000/8001`). Если у
  бэкенда уже занят `8100/8200` — поправить в `docker-compose.yml`.
- **ML-1:** embedding-модель в Ollama — **`nomic-embed-text`** (одна и та же
  для RAG и Mem0, чтобы не плодить индексы). LLM для Mem0 — пока
  `llama3.1:8b`, финал за ML-1.
- Whisper-модель по умолчанию `small` — перейти на `medium`, если будет
  заметная потеря качества на русском.
