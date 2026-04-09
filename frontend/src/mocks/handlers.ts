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

  image:
    'Изображение успешно обработано! Вижу на нём структурированный контент. Для реального анализа используй модель **GPT-4o** или **LLaVA** — они поддерживают vision.',

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
}

function pickResponse(message: string, model: string): string {
  if (model === 'dall-e-3') {
    return '![Сгенерированное изображение](https://picsum.photos/seed/' + Math.floor(Math.random() * 1000) + '/512/512)'
  }
  if (model === 'deepseek-coder' || /код|code|функци|function|debug|баг|реализ|implement/i.test(message)) {
    return RESPONSES.code
  }
  if (/файл|документ|document|file|pdf/i.test(message)) return RESPONSES.document
  if (/изображен|картинк|фото|image|photo/i.test(message)) return RESPONSES.image
  if (/памят|memory|запомни|remember/i.test(message)) return RESPONSES.memory
  if (/\?/.test(message) || /почему|зачем|как|что такое|объясни|расскажи/i.test(message)) return RESPONSES.question
  return RESPONSES.default
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function createStreamResponse(text: string): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // Stream word by word with natural pauses
      const words = text.split(' ')
      for (const word of words) {
        const chunk = `data: ${JSON.stringify({ delta: word + ' ' })}\n\n`
        controller.enqueue(encoder.encode(chunk))
        await delay(30 + Math.random() * 50)
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
    const body = await request.json() as { message: string; model: string }
    const response = pickResponse(body.message, body.model)
    return createStreamResponse(response)
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
]
