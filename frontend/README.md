# GPTHub — Frontend

React-приложение: мультимодельный AI-чат с голосовым вводом, работой с файлами и долгосрочной памятью.

**Стек:** React 19 · TypeScript · Vite · Tailwind CSS v4 · Zustand · React Router · MSW (моки)

---

## Быстрый старт

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
npm run build     # продакшн-сборка в dist/
```

---

## Режим без бэкенда (MSW)

В dev-режиме все запросы перехватывает **MSW (Mock Service Worker)** — бэкенд не нужен.
Моки в `src/mocks/handlers.ts`, воркер — `public/mockServiceWorker.js`.

Что работает в моках: стриминговый чат, загрузка файлов, голосовая транскрипция, память (in-memory CRUD), список моделей.

Чтобы **отключить моки** и перейти на реальный бэкенд — убери вызов `enableMocking()` в `src/main.tsx`.

---

## Подключение к бэкенду

### Переменная окружения

Создай `.env.local` в корне `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Если не задана — запросы идут на `/api` и проксируются Vite (см. `vite.config.ts` → `target: http://localhost:8000`).

---

## API-контракт

Все запросы к `BASE_URL` (по умолчанию `/api`). Формат данных — JSON, если не указано иное.

---

### Чат

#### `POST /api/chat/completions` — стриминговый ответ

**Тело запроса:**

```json
{
  "conversation_id": "string (UUID)",
  "message": "string",
  "model": "mws-gpt-alpha | kodify-2.0 | cotype-preview-32k",
  "file_ids": ["string"],
  "task_category": "code | image_gen | image_analysis | document | simple | complex | research | web_search | presentation",
  "web_search": false,
  "research_mode": false,
  "presentation_mode": false
}
```

**Все поля обязательны.** `file_ids` может быть пустым массивом.

**Ответ:** `Content-Type: text/event-stream`, Server-Sent Events:

```
data: {"delta": "первая часть ответа "}

data: {"delta": "продолжение "}

data: [DONE]
```

Фронтенд читает поток построчно, склеивает `.delta` из каждой строки. Конец потока — строка `data: [DONE]`.

**Важно:** бэкенд должен завершить поток именно строкой `data: [DONE]`, иначе стриминг зависнет.

---

### Авто-роутинг моделей

Фронтенд сам определяет модель (`src/lib/modelRouter.ts`), если пользователь выбрал **Auto**:

| `task_category` | Выбирается модель | Условие |
|---|---|---|
| `presentation` | `cotype-preview-32k` | явный режим или ключевые слова |
| `research` | `cotype-preview-32k` | явный режим |
| `web_search` | `mws-gpt-alpha` | явный режим или URL в тексте |
| `image_analysis` | `mws-gpt-alpha` | прикреплено изображение |
| `image_gen` | `mws-gpt-alpha` | «нарисуй», «сгенерируй картинку», «generate image» |
| `code` | `kodify-2.0` | «код», «функция», «python», «def », «import», «debug» |
| `document` | `cotype-preview-32k` | прикреплён любой файл |
| `simple` | `mws-gpt-alpha` | сообщение < 80 символов |
| `complex` | `cotype-preview-32k` | всё остальное |

Бэкенд получает уже вычисленные `task_category` и `model` — просто использует их для маршрутизации.

---

### Режимы (взаимоисключающие)

Пользователь может включить один из трёх режимов через кнопки в поле ввода:

| Флаг в запросе | Режим | Поведение |
|---|---|---|
| `web_search: true` | Поиск в интернете | Нужен поиск перед ответом |
| `research_mode: true` | Deep Research | Глубокий анализ, несколько шагов |
| `presentation_mode: true` | Презентация | Структурированный вывод для PPTX |

Если все `false` — обычный чат, модель и категория определяются авто-роутингом.

---

### Файлы

#### `POST /api/files/upload`

**Тело:** `multipart/form-data`, поле `file`.

**Ответ:**

```json
{
  "id": "string (UUID)",
  "name": "document.pdf",
  "size": 524288,
  "type": "application/pdf"
}
```

Возвращённый `id` передаётся в `file_ids` при следующем запросе к `/chat/completions`.
Бэкенд должен сохранить файл и при чате использовать его содержимое через RAG.

**Принимаемые типы файлов:**

```
Документы:  .pdf  .docx  .txt  .xlsx  .csv
Изображения: .png  .jpg  .jpeg  .gif  .webp
Аудио:      .mp3  .wav  .ogg  .webm  .m4a
```

**Лимиты:** изображения — 5 MB, остальные — 10 MB (проверяется на фронте).

---

### Голос

#### `POST /api/voice/transcribe` — Speech-to-Text

**Тело:** `multipart/form-data`, поле `audio` (blob, `audio/webm`).

**Ответ:**

```json
{ "text": "распознанный текст" }
```

Адаптер к Whisper (FastAPI пример):

```python
@app.post("/api/voice/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    data = await audio.read()
    async with httpx.AsyncClient() as client:
        r = await client.post(
            "http://whisper:8000/transcribe",
            files={"file": (audio.filename, data, audio.content_type)},
        )
    return {"text": r.json()["text"]}
```

#### `POST /api/voice/synthesize` — Text-to-Speech

**Тело:**

```json
{ "text": "текст для озвучки" }
```

**Ответ:** бинарный аудиофайл (`audio/mpeg` или `audio/wav`).

---

### Память

#### `GET /api/memory?query=<строка>` — поиск

**Ответ:** массив записей:

```json
[
  {
    "id": "string",
    "content": "Пользователь предпочитает краткие ответы",
    "category": "preference",
    "createdAt": 1712345678000
  }
]
```

**Категории памяти:**

| Категория | Что хранить |
|---|---|
| `profile` | Имя, роль, базовые данные о пользователе |
| `project` | Проекты, репозитории, задачи |
| `team` | Коллеги, команда |
| `deadline` | Дедлайны, даты |
| `stack` | Технологии, инструменты |
| `preference` | Предпочтения в стиле ответов |
| `context` | Рабочий контекст, ситуация |
| `fact` | Прочие факты |

#### `POST /api/memory` — добавить запись

**Тело:**

```json
{
  "content": "string",
  "category": "profile | project | team | deadline | stack | preference | context | fact"
}
```

**Ответ:** созданная запись `MemoryEntry` (с `id` и `createdAt`).

#### `DELETE /api/memory/:id` — удалить запись

**Ответ:** `204 No Content`.

Интеграция: используй **Mem0** с ChromaDB и Ollama embeddings (`nomic-embed-text`).
Конфиг уже готов в `../mem0_config.py`.

---

### Модели (опционально)

Если реализуешь динамический список — фронт вызовет:

#### `GET /api/models`

**Ответ:**

```json
[
  {
    "id": "mws-gpt-alpha",
    "name": "MWS GPT Alpha",
    "provider": "mws",
    "capabilities": ["text", "vision", "large_context"],
    "contextWindow": 128000
  },
  {
    "id": "kodify-2.0",
    "name": "Kodify 2.0",
    "provider": "mws",
    "capabilities": ["text", "code"],
    "contextWindow": 32000
  },
  {
    "id": "cotype-preview-32k",
    "name": "CoType Preview 32K",
    "provider": "mws",
    "capabilities": ["text", "large_context"],
    "contextWindow": 32768
  }
]
```

Если эндпоинт не реализован — фронт использует захардкоженный список из `src/lib/constants.ts`.

---

## Типы данных

```typescript
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  blocks?: ContentBlock[]       // rich-контент (поиск, шаги research, превью URL)
  model?: string                // какая модель ответила
  taskCategory?: TaskCategory
  files?: FileAttachment[]      // только для user-сообщений
  timestamp: number             // unix ms
}

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; url: string; alt?: string }
  | { type: 'search_results'; query: string; results: SearchResult[] }
  | { type: 'research_step'; title: string; detail: string; status: 'running' | 'done' }
  | { type: 'url_preview'; url: string; title?: string; description?: string; image?: string }

interface Conversation {
  id: string
  title: string
  model: string                 // 'auto' или ID модели
  createdAt: number
  updatedAt: number
}

interface FileAttachment {
  id: string
  name: string
  size: number
  type: string                  // MIME-type
  status: 'pending' | 'uploading' | 'uploaded' | 'error'
}

interface MemoryEntry {
  id: string
  content: string
  category: string
  createdAt: number
  relevance?: number            // 0–1, опционально
}
```

---

## Инфраструктура

| Сервис | Адрес | Назначение |
|---|---|---|
| Бэкенд (FastAPI) | `localhost:8000` | Основной API |
| Whisper | `localhost:8100` | STT: `POST /transcribe` (поле `file`) |
| ChromaDB | `localhost:8200` | Vector store для Mem0 / RAG |

Запуск через Docker Compose:

```bash
docker compose up -d
```

---

## Архитектура фронтенда

```
src/
├── components/
│   ├── chat/         # ChatContainer, ChatInput, MessageList, MessageBubble, ModelSelector
│   ├── voice/        # VoiceRecordButton, TTSPlayButton
│   ├── file/         # FilePreview, FileChip, ImagePreview
│   ├── landing/      # FeatureCard
│   ├── memory/       # MemorySidebar
│   ├── layout/       # AppLayout, Sidebar, Header, ThemeProvider, ThemeToggle
│   └── MascotIcon    # SVG-маскот (favicon + логотип)
├── pages/            # LandingPage, ChatPage, SettingsPage
├── stores/           # Zustand: chatStore, modelStore, memoryStore, fileStore, uiStore, voiceStore
├── services/         # chatService, voiceService, memoryService, fileService, api
├── hooks/            # useChat, useVoiceRecording, useFileUpload, useAutoResize, useScrollToBottom
├── mocks/            # MSW handlers и данные (dev-only)
├── lib/              # constants, modelRouter, utils
└── types/            # TypeScript-интерфейсы
```

### Поток данных чата

```
ChatInput
  → useChat hook
    → fileService.uploadFile()        # если есть файлы
    → chatStore.addMessage()          # сохранить user-сообщение
    → chatService.streamMessage()     # POST /api/chat/completions (SSE)
      → chatStore.updateStreamingContent()   # по каждому delta-чанку
      → chatStore.finalizeStreaming()        # записать assistant-сообщение
  → MessageList → MessageBubble      # рендер
```

### State (Zustand)

| Store | Что хранит | Персист (localStorage) |
|---|---|---|
| `chatStore` | разговоры, сообщения, флаги стриминга | да |
| `modelStore` | список моделей, выбранная модель | да |
| `memoryStore` | записи памяти, открыта ли панель | да |
| `fileStore` | файлы ожидающие отправки | нет |
| `uiStore` | сайдбар открыт, включённые режимы | нет |
| `voiceStore` | состояние записи | нет |

---

## Примеры запросов

**Простой текстовый чат:**

```bash
curl -X POST http://localhost:8000/api/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Напиши быструю сортировку на Python",
    "model": "kodify-2.0",
    "file_ids": [],
    "task_category": "code",
    "web_search": false,
    "research_mode": false,
    "presentation_mode": false
  }'
```

**Ожидаемый ответ (SSE):**

```
data: {"delta": "def quicksort(arr):"}
data: {"delta": "\n    if len(arr) <= 1:"}
data: {"delta": "\n        return arr"}
...
data: [DONE]
```

**Загрузка файла:**

```bash
curl -X POST http://localhost:8000/api/files/upload \
  -F "file=@document.pdf"

# Ответ:
# {"id": "abc-123", "name": "document.pdf", "size": 204800, "type": "application/pdf"}
```

**Чат с файлом:**

```bash
curl -X POST http://localhost:8000/api/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Кратко перескажи содержание",
    "model": "cotype-preview-32k",
    "file_ids": ["abc-123"],
    "task_category": "document",
    "web_search": false,
    "research_mode": false,
    "presentation_mode": false
  }'
```
