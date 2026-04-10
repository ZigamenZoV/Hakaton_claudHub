import { http, HttpResponse } from 'msw'
import { MODELS } from './data/models'
import { generateId } from '@/lib/utils'

// ---------------------------------------------------------------------------
// In-memory state (resets on page reload — fine for dev)
// ---------------------------------------------------------------------------

interface MemoryItem {
  id: string
  content: string
  category: string
  createdAt: number
}

const memoryStore: MemoryItem[] = [
  { id: generateId(), content: 'Пользователь предпочитает краткие ответы', category: 'preference', createdAt: Date.now() - 86400000 },
  { id: generateId(), content: 'Работает над проектом GPTHub — AI-ассистент с памятью', category: 'task', createdAt: Date.now() - 3600000 },
]

// ---------------------------------------------------------------------------
// Chat response templates
// ---------------------------------------------------------------------------

const RESPONSES: Record<string, string> = {
  default:
    `Привет! Я GPTHub — твой умный AI-ассистент. Я умею отвечать на вопросы, помогать с кодом, анализировать файлы и изображения, а также генерировать картинки.

Вот что я умею:
- **Текстовые задачи** — объяснения, резюме, переводы
- **Код** — написание, отладка, ревью
- **Файлы** — анализ документов и изображений
- **Память** — запоминаю контекст о тебе

Чем могу помочь?`,

  code: `Вот реализация на TypeScript:

\`\`\`typescript
// Fibonacci с мемоизацией — O(n) вместо O(2ⁿ)
function fibonacci(n: number, memo = new Map<number, number>()): number {
  if (n <= 1) return n
  if (memo.has(n)) return memo.get(n)!
  const result = fibonacci(n - 1, memo) + fibonacci(n - 2, memo)
  memo.set(n, result)
  return result
}

// Пример использования
console.log(fibonacci(10)) // 55
console.log(fibonacci(50)) // 12586269025
\`\`\`

Мемоизация кэширует уже вычисленные значения, поэтому каждое число считается ровно один раз. Для больших \`n\` это критично — без неё stack overflow.`,

  image_analysis:
    `Анализ изображения завершён. Вот что я вижу:

- **Тип**: Фотография / скриншот
- **Основные объекты**: Текст, интерфейс приложения
- **Цветовая палитра**: Тёмные тона с акцентами
- **Качество**: Высокое разрешение

Для более детального анализа можете задать конкретный вопрос о содержимом изображения.`,

  document:
    `Документ загружен. Краткое содержание:

- Файл содержит структурированные данные
- Основные разделы обработаны
- Готов отвечать на вопросы по содержимому

Что именно тебя интересует в этом документе?`,

  question:
    `Отличный вопрос. Вот что я думаю по этому поводу:

Это зависит от контекста задачи. Если приоритет — **скорость**, лучше выбрать более лёгкую модель (Mistral 7B). Если важно **качество** — GPT-4o или Llama 3.

На практике оптимальный подход — автоматический роутинг: простые вопросы → fast модель, сложные → мощная. Именно так и работает режим **Auto** в GPTHub.`,

  memory:
    `Я помню о тебе следующее из нашей истории общения:

- Ты работаешь над AI-проектом
- Предпочитаешь конкретные, практичные ответы
- Интересуешься архитектурой LLM-приложений

Память помогает мне давать более релевантные ответы. Управлять ею можно в разделе **Настройки → Память**.`,

  web_search:
    `Вот что я нашёл по твоему запросу:

На основании найденных источников:

1. **Основной результат** — Согласно последним данным, технология активно развивается и находит всё более широкое применение в индустрии.

2. **Ключевые тренды**:
   - Рост производительности моделей на 40% за последний квартал
   - Новые архитектуры позволяют обрабатывать контексты до 1М+ токенов
   - Снижение стоимости инференса благодаря оптимизации

3. **Источники**: Результаты основаны на актуальных публикациях и исследованиях.

Хочешь узнать подробнее по какому-то из пунктов?`,

  research:
    `# Глубокий анализ: Результаты исследования

## Методология
Проведён анализ из **12 источников**, включая научные публикации, технические документации и актуальные обзоры.

## Основные выводы

### 1. Текущее состояние
Область демонстрирует значительный прогресс. Ключевые метрики улучшились на **35-50%** по сравнению с предыдущим поколением решений.

### 2. Архитектурные подходы
| Подход | Плюсы | Минусы |
|--------|-------|--------|
| Transformer | Высокое качество | Ресурсоёмкость |
| Mamba/SSM | Линейная сложность | Меньше данных для обучения |
| Hybrid | Баланс | Сложность реализации |

### 3. Практические рекомендации
- Для **production** систем рекомендуется гибридный подход
- Мониторинг качества через A/B-тестирование
- Итеративное улучшение на основе пользовательского фидбека

### 4. Прогноз
Ожидается дальнейшая конвергенция подходов в ближайшие 6-12 месяцев.

---
*Анализ выполнен в режиме Deep Research с проверкой нескольких независимых источников.*`,

  presentation: `# Презентация сгенерирована!

Вот структура вашей презентации:

## Слайд 1 — Титульный
**Заголовок**: Тема презентации
**Подзаголовок**: Подготовлено с помощью GPTHub AI

## Слайд 2 — Введение
- Контекст и актуальность темы
- Цели и задачи
- Ключевые вопросы

## Слайд 3 — Основная часть
- Факт 1: Описание с данными и статистикой
- Факт 2: Анализ трендов
- Визуализация: график роста показателей

## Слайд 4 — Детали
| Параметр | Значение | Тренд |
|----------|----------|-------|
| Метрика A | 85% | ↑ +12% |
| Метрика B | 1.2M | ↑ +8% |
| Метрика C | 94/100 | → 0% |

## Слайд 5 — Выводы
1. Ключевой вывод номер один
2. Рекомендации по следующим шагам
3. Контактная информация

---
*Презентация готова к скачиванию в формате PPTX. Нажмите кнопку ниже для загрузки.*

📥 **[Скачать презентацию (.pptx)](#)**`,

  image_gen: `Изображение сгенерировано! Вот результат:

![Сгенерированное изображение](https://picsum.photos/seed/gpthub/512/512)

Параметры генерации:
- **Модель**: MWS GPT Alpha
- **Разрешение**: 512×512
- **Стиль**: Автоматический

Хочешь изменить что-то или сгенерировать новое?`,
}

function pickResponse(message: string, model: string, opts?: { web_search?: boolean; research_mode?: boolean; presentation_mode?: boolean; task_category?: string }): string {
  if (opts?.presentation_mode || opts?.task_category === 'presentation') return RESPONSES.presentation
  if (opts?.research_mode || opts?.task_category === 'research') return RESPONSES.research
  if (opts?.web_search || opts?.task_category === 'web_search') return RESPONSES.web_search
  if (opts?.task_category === 'image_gen') return RESPONSES.image_gen
  if (opts?.task_category === 'image_analysis') return RESPONSES.image_analysis
  if (model === 'dall-e-3') {
    return '![Сгенерированное изображение](https://picsum.photos/seed/' + Math.floor(Math.random() * 1000) + '/512/512)'
  }
  if (model === 'kodify-2.0' || /код|code|функци|function|debug|баг|реализ|implement/i.test(message)) {
    return RESPONSES.code
  }
  if (/файл|документ|document|file|pdf/i.test(message)) return RESPONSES.document
  if (/презентаци|слайд|pptx|powerpoint/i.test(message)) return RESPONSES.presentation
  if (/изображен|картинк|фото|image|photo|нарисуй|generate/i.test(message)) return RESPONSES.image_gen
  if (/памят|memory|запомни|remember/i.test(message)) return RESPONSES.memory
  if (/\?/.test(message) || /почему|зачем|как|что такое|объясни|расскажи/i.test(message)) return RESPONSES.question
  return RESPONSES.default
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function createStreamResponse(text: string, delayMs = 30): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const words = text.split(' ')
      for (const word of words) {
        const chunk = `data: ${JSON.stringify({ delta: word + ' ' })}\n\n`
        controller.enqueue(encoder.encode(chunk))
        await delay(delayMs + Math.random() * 50)
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const handlers = [
  // Chat completions — streaming SSE
  http.post('/api/chat/completions', async ({ request }) => {
    const body = await request.json() as {
      message: string
      model: string
      web_search?: boolean
      research_mode?: boolean
      presentation_mode?: boolean
      task_category?: string
    }
    const response = pickResponse(body.message, body.model, {
      web_search: body.web_search,
      research_mode: body.research_mode,
      presentation_mode: body.presentation_mode,
      task_category: body.task_category,
    })
    // Research mode streams slower to simulate "thinking"
    const streamDelay = body.research_mode ? 50 : 30
    return createStreamResponse(response, streamDelay)
  }),

  // Models list
  http.get('/api/models', () => {
    return HttpResponse.json(MODELS)
  }),

  // Conversations (state is managed client-side in Zustand, API is a fallback)
  http.get('/api/conversations', () => {
    return HttpResponse.json([])
  }),

  http.get('/api/conversations/:id/messages', () => {
    return HttpResponse.json([])
  }),

  http.delete('/api/conversations/:id', () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // File upload
  http.post('/api/files/upload', async ({ request }) => {
    const form = await request.formData()
    const file = form.get('file') as File
    await delay(400 + Math.random() * 300)
    return HttpResponse.json({
      id: generateId(),
      name: file.name,
      size: file.size,
      type: file.type,
    })
  }),

  // Voice transcription — simulates STT with varied results
  http.post('/api/voice/transcribe', async () => {
    await delay(800 + Math.random() * 400)
    const samples = [
      'Привет, помоги мне разобраться с этой задачей.',
      'Напиши функцию сортировки на TypeScript.',
      'Что такое векторная база данных?',
      'Как работает Mem0?',
      'Объясни архитектуру этого проекта.',
    ]
    return HttpResponse.json({
      text: samples[Math.floor(Math.random() * samples.length)],
    })
  }),

  // Voice synthesis — return minimal valid audio blob
  http.post('/api/voice/synthesize', async () => {
    await delay(200)
    return new HttpResponse(new Blob([], { type: 'audio/mpeg' }), {
      headers: { 'Content-Type': 'audio/mpeg' },
    })
  }),

  // Memory — stateful in-memory store
  http.get('/api/memory', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('query')?.toLowerCase() ?? ''
    const results = query
      ? memoryStore.filter((m) => m.content.toLowerCase().includes(query))
      : memoryStore
    return HttpResponse.json([...results].reverse())
  }),

  http.post('/api/memory', async ({ request }) => {
    const body = await request.json() as { content: string; category: string }
    const entry: MemoryItem = {
      id: generateId(),
      content: body.content,
      category: body.category,
      createdAt: Date.now(),
    }
    memoryStore.push(entry)
    return HttpResponse.json(entry)
  }),

  http.delete('/api/memory/:id', ({ params }) => {
    const idx = memoryStore.findIndex((m) => m.id === params.id)
    if (idx !== -1) memoryStore.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  // Image generation
  http.post('/api/images/generate', async () => {
    await delay(1500 + Math.random() * 1000)
    return HttpResponse.json({
      url: `https://picsum.photos/seed/${Math.floor(Math.random() * 10000)}/512/512`,
    })
  }),

  // Web search
  http.post('/api/web/search', async ({ request }) => {
    const body = await request.json() as { query: string }
    await delay(600 + Math.random() * 400)
    return HttpResponse.json({
      query: body.query,
      results: [
        { title: 'Результат 1 — Документация', url: 'https://example.com/docs', snippet: 'Подробная документация по теме запроса с примерами использования и лучшими практиками.' },
        { title: 'Результат 2 — Туториал', url: 'https://example.com/tutorial', snippet: 'Пошаговое руководство для начинающих с объяснением основных концепций.' },
        { title: 'Результат 3 — Обсуждение', url: 'https://example.com/discuss', snippet: 'Обсуждение сообщества с ответами экспертов и практическими советами.' },
      ],
    })
  }),

  // URL parsing / preview
  http.post('/api/web/parse', async ({ request }) => {
    const body = await request.json() as { url: string }
    await delay(800 + Math.random() * 400)
    const hostname = new URL(body.url).hostname
    return HttpResponse.json({
      url: body.url,
      title: `Страница на ${hostname}`,
      description: 'Содержимое страницы было успешно извлечено и проанализировано. Основные тезисы доступны для обсуждения.',
      image: `https://picsum.photos/seed/${hostname}/400/200`,
    })
  }),
]
