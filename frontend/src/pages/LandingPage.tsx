import { useNavigate } from 'react-router-dom'
import {
  BrainCircuit,
  MessageSquare,
  Image,
  FileText,
  Mic,
  Zap,
  Brain,
  ChevronRight,
} from 'lucide-react'
import { FeatureCard } from '@/components/landing/FeatureCard'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { useChatStore } from '@/stores/chatStore'

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Мультимодельный чат',
    description: 'GPT-4o, Mistral, Llama, DeepSeek — все модели в одном интерфейсе с историей диалогов.',
  },
  {
    icon: Zap,
    title: 'Авто-роутинг моделей',
    description: 'Система сама выбирает лучшую модель под задачу: код, анализ, изображения, простые вопросы.',
  },
  {
    icon: FileText,
    title: 'Работа с файлами',
    description: 'Загрузи PDF, DOCX, Excel, CSV — задай вопросы по содержимому с помощью RAG.',
  },
  {
    icon: Image,
    title: 'Мультимодальность',
    description: 'Анализируй изображения с vision-моделями и генерируй картинки через DALL-E.',
  },
  {
    icon: Mic,
    title: 'Голосовой ввод/вывод',
    description: 'Говори голосом — Whisper распознаёт, TTS озвучивает ответы. Полноценный голосовой режим.',
  },
  {
    icon: Brain,
    title: 'Долгосрочная память',
    description: 'AI помнит твои предпочтения и контекст между сессиями через Mem0-совместимый слой.',
  },
]

export function LandingPage() {
  const navigate = useNavigate()
  const { createConversation } = useChatStore()

  function handleStart() {
    const id = createConversation()
    navigate(`/chat/${id}`)
  }

  return (
    <div className="min-h-dvh bg-[var(--color-background)]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-7 w-7 text-[var(--color-primary)]" />
          <span className="text-xl font-bold text-[var(--color-foreground)]">GPTHub</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={handleStart}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity"
          >
            Открыть чат <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 text-center overflow-hidden">
        {/* Decorative gradient blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[var(--color-primary)]/15 blur-3xl" />
          <div className="absolute top-1/3 -left-20 w-72 h-72 rounded-full bg-[#7c3aed]/10 blur-3xl" />
          <div className="absolute top-1/4 -right-20 w-80 h-80 rounded-full bg-[var(--color-primary)]/8 blur-3xl" />
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-1.5 text-sm text-[var(--color-primary)] font-medium mb-6">
          <Zap className="h-3.5 w-3.5" />
          Хакатон МТС 2025
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-[var(--color-foreground)] mb-6 leading-tight">
          Один чат для{' '}
          <span className="bg-gradient-to-r from-[var(--color-primary)] to-[#ff6b35] bg-clip-text text-transparent">
            всех AI-моделей
          </span>
        </h1>
        <p className="text-xl text-[var(--color-muted-foreground)] max-w-2xl mx-auto mb-10 leading-relaxed">
          GPTHub объединяет лучшие языковые модели, голосовой ввод, работу с файлами и долгосрочную память
          в едином умном интерфейсе.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleStart}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--color-primary)] to-[#ff5030] px-8 py-4 text-base font-semibold text-white hover:opacity-90 transition-opacity shadow-xl shadow-[var(--color-primary)]/30"
          >
            Начать бесплатно <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-8 py-4 text-base font-medium text-[var(--color-foreground)] hover:bg-[var(--color-accent)] transition-colors"
          >
            Просмотреть демо
          </button>
        </div>
      </div>

      {/* Features grid */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-center text-3xl font-bold text-[var(--color-foreground)] mb-3">
          Всё что нужно для работы с AI
        </h2>
        <p className="text-center text-[var(--color-muted-foreground)] mb-10">
          Мощные возможности, красивый интерфейс
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>

      {/* CTA bottom */}
      <div className="border-t border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-[var(--color-foreground)] mb-4">
            Готов попробовать?
          </h2>
          <p className="text-[var(--color-muted-foreground)] mb-8">
            Начни использовать GPTHub прямо сейчас — без регистрации
          </p>
          <button
            onClick={handleStart}
            className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-primary)] px-8 py-4 text-base font-semibold text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity"
          >
            Открыть GPTHub <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
