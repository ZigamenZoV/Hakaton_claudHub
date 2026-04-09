# Hakaton — voice + memory + LLM infra

Инфраструктура для голосового ассистента с долговременной памятью:
`faster-whisper` (STT) + `ChromaDB` (vector store) + `Mem0` (memory layer) +
`Ollama` (локальные LLM/embeddings, GPU) + `Open WebUI` (единый UI для Ollama
и OpenAI).

## Сервисы

| Сервис     | Внутри docker-сети       | На хосте                 | Назначение                        |
|------------|--------------------------|--------------------------|-----------------------------------|
| whisper    | `http://whisper:8000`    | `http://localhost:8100`  | STT, эндпоинт `/transcribe`       |
| chromadb   | `http://chromadb:8000`   | `http://localhost:8200`  | Vector store для Mem0 / RAG       |
| ollama     | `http://ollama:11434`    | `http://localhost:11434` | Локальные LLM + embeddings (GPU)  |
| open-webui | `http://open-webui:8080` | `http://localhost:3000`  | UI: Ollama + OpenAI в одном чате  |

Все сервисы подключены к сети `hakaton` (см. `docker-compose.yml`). Бэкендеру
достаточно присоединить свой сервис к этой сети — и обращаться по именам выше.

## Предварительные требования

- Docker + Docker Compose v2
- NVIDIA GPU + установленный `nvidia-container-toolkit`
  (проверка: `docker info | grep -i nvidia`)
- (Опционально) OpenAI API-ключ для моделей `gpt-4o` / `gpt-4o-mini` / `gpt-4-turbo`

## Быстрый старт

```bash
cp .env.example .env          # вписать реальный OPENAI_API_KEY
docker compose up -d --build
docker info | grep -i nvidia  # убедиться что NVIDIA runtime виден
docker exec ollama nvidia-smi # GPU доступен внутри контейнера
bash scripts/pull_ollama_models.sh
python scripts/test_ollama.py
```

Первый билд whisper ~5–10 мин (CTranslate2 + ffmpeg). Модель (`small` по
умолчанию) качается при первом запросе к `/transcribe` и кэшируется в
`./whisper_cache`. Модели Ollama (~20 ГБ суммарно) качаются скриптом
`pull_ollama_models.sh`.

## Проверка сервисов

### Whisper (STT)

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

### ChromaDB

```bash
pip install -r requirements-dev.txt
python scripts/test_chromadb.py
```

### Ollama

Сервис `ollama` крутится как контейнер и пробрасывает GPU через NVIDIA runtime
(`deploy.resources.reservations.devices`).

После первого `docker compose up -d` накатить базовый набор моделей:

```bash
bash scripts/pull_ollama_models.sh
```

Скачиваются:

| Модель             | Размер | Назначение                                |
|--------------------|--------|-------------------------------------------|
| `llama3:8b`        | ~4.7 GB | Основная текстовая модель                |
| `mistral:7b`       | ~4.1 GB | Быстрая модель для простых запросов      |
| `llava:7b`         | ~4.5 GB | Vision-модель (текст + изображения)      |
| `nomic-embed-text` | ~274 MB | Embedding-модель для RAG и Mem0          |

Smoke-тест из питона (latency по моделям):

```bash
python scripts/test_ollama.py
```

### Open WebUI

Доступен на <http://localhost:3000>.

**Ollama-модели** появляются автоматически — endpoint `http://ollama:11434`
прописан в docker-compose.

**OpenAI-модели** (`gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`) — чтобы появились
в селекторе, нужно:

1. В `.env` задать `OPENAI_API_KEY=sk-proj-...`
   (ключ создаётся на https://platform.openai.com/api-keys)
2. Пересоздать сервис: `docker compose up -d open-webui`
3. В UI: *Settings → Connections → OpenAI API* — endpoint
   `https://api.openai.com/v1` уже выставлен через env

Проверить: в дропдауне моделей должны быть видны и Ollama-, и OpenAI-модели.
На LLaVA проверить загрузку картинки и вопрос к ней.

Без `OPENAI_API_KEY` Open WebUI работает только с локальными Ollama-моделями.

### Mem0

Требует поднятого `ollama` с моделью `nomic-embed-text` (есть в скрипте выше):

```bash
python scripts/test_mem0.py
```

Конфиг Mem0 — в `mem0_config.py`. Берёт ChromaDB как vector store и Ollama
(`nomic-embed-text`) как embedder. LLM по умолчанию — `llama3.1:8b`,
переопределяется через `OLLAMA_LLM_MODEL`.

## Выбор модели Whisper

| Модель   | RAM   | Качество ru | Скорость (CPU int8) |
|----------|-------|-------------|---------------------|
| tiny     | ~1 GB | низкое      | очень быстро        |
| base     | ~1 GB | среднее     | быстро              |
| **small**| ~2 GB | хорошее     | приемлемо (дефолт)  |
| medium   | ~5 GB | очень хор.  | медленно на CPU     |
| large-v3 | ~10 GB| лучшее      | только с GPU        |

Переключить: `WHISPER_MODEL=medium docker compose up -d`.

## Структура репо

```
hakaton/
├── docker-compose.yml          # whisper + chromadb + ollama + open-webui
├── .env.example                # все переменные окружения с комментариями
├── whisper/
│   ├── Dockerfile              # python:3.11-slim + ffmpeg + faster-whisper
│   ├── requirements.txt
│   └── app.py                  # FastAPI: POST /transcribe, GET /health
├── mem0_config.py              # Mem0 ← ChromaDB + Ollama nomic-embed-text
├── scripts/
│   ├── pull_ollama_models.sh   # pull базовых моделей + smoke-test
│   ├── test_ollama.py          # latency-тест Ollama моделей
│   ├── test_chromadb.py
│   └── test_mem0.py
├── requirements-dev.txt        # chromadb, mem0ai, requests
├── chroma_data/                # persistent volume (gitignore)
├── ollama_data/                # модели Ollama (gitignore)
├── open_webui_data/            # данные Open WebUI (gitignore)
└── whisper_cache/              # HF cache для моделей (gitignore)
```

## Согласования с командой

- **Бэкенд:** имена сервисов `whisper`, `chromadb`, `ollama`, `open-webui`,
  сеть `hakaton`. Хост-порты `8100` / `8200` / `11434` / `3000`.
  Если у бэкенда уже занят порт — поправить в `docker-compose.yml`.
- **ML-1:** embedding-модель в Ollama — **`nomic-embed-text`** (одна и та же
  для RAG и Mem0, чтобы не плодить индексы — согласовано с ML-2). LLM для
  Mem0 — пока `llama3.1:8b`, финал за ML-1.
- **OpenAI ключ:** живёт только в `.env` (`OPENAI_API_KEY`), в код/репо не
  попадает — `.env` в `.gitignore`.
- Whisper-модель по умолчанию `small` — перейти на `medium`, если будет
  заметная потеря качества на русском.
