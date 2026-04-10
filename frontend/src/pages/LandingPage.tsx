import { useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  Image,
  FileText,
  Mic,
  Zap,
  Brain,
  ChevronRight,
  Sparkles,
  Plus,
  Calendar,
  Trophy,
} from 'lucide-react'
import { MascotIcon } from '@/components/MascotIcon'
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
          <MascotIcon size={38} />
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

      {/* Hero — MTS True Tech Hack card style */}
      <div className="max-w-6xl mx-auto px-6 pt-10 pb-16">
        <div className="hero-card relative overflow-hidden rounded-[2.5rem] p-8 sm:p-12 lg:p-14 border border-white/10 shadow-2xl shadow-purple-900/40">
          {/* MTS red logo block (top right) */}
          <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-20">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-[#ff0032] shadow-lg shadow-[#ff0032]/50">
              <div className="flex flex-col items-center justify-center gap-0 leading-none">
                <span className="text-[10px] sm:text-xs font-black text-white tracking-tight">М Т С</span>
              </div>
            </div>
          </div>

          {/* Content grid */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
            {/* LEFT: text content */}
            <div className="flex flex-col gap-6">
              {/* Prize pool pill */}
              <div>
                <span className="pill-tag">
                  <Trophy className="h-3.5 w-3.5 text-yellow-300" />
                  Призовой фонд: 1 500 000 ₽
                </span>
              </div>

              {/* Tech tags row */}
              <div className="flex flex-wrap gap-2">
                <span className="pill-tag">MWS GPT</span>
                <span className="pill-tag">MWS Octapi</span>
                <span className="pill-tag">MWS Tables</span>
                <span className="pill-tag">
                  <Plus className="h-3.5 w-3.5" />
                </span>
              </div>

              {/* Brand pills */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center rounded-full bg-[#ff0032] px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-[#ff0032]/40">
                  MTS True Tech
                </span>
                <span className="inline-flex items-center rounded-full bg-[#7f3dff] px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-[#7f3dff]/40">
                  Hack
                </span>
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-white/30 bg-white/10 text-white">
                  <Plus className="h-4 w-4" />
                </span>
              </div>

              {/* Giant title */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[0.95] tracking-tight">
                ИНИЦ<span className="text-[#ff0032] pulse-glow inline-block">ИИ</span>РУЙ
                <br />
                БУДУЩЕЕ
              </h1>

              {/* Date pill */}
              <div className="flex items-center gap-3 mt-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#7f3dff] px-5 py-2.5 text-base font-bold text-white shadow-lg shadow-[#7f3dff]/40">
                  <Calendar className="h-4 w-4" />
                  10–24 апреля
                </span>
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4">
                <button
                  onClick={handleStart}
                  className="flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-semibold text-[#2a0f5c] hover:bg-white/90 transition-all shadow-xl hover:scale-[1.02]"
                >
                  <Sparkles className="h-5 w-5" />
                  Начать с GPTHub
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => navigate('/chat')}
                  className="flex items-center gap-2 rounded-2xl border border-white/30 bg-white/5 px-8 py-4 text-base font-medium text-white hover:bg-white/15 transition-colors backdrop-blur"
                >
                  Демо
                </button>
              </div>
            </div>

            {/* RIGHT: Robot character stack */}
            <div className="relative hidden lg:flex items-center justify-center h-full min-h-[400px]">
              {/* Glow */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-80 w-80 rounded-full bg-gradient-to-br from-[#9d5cff]/40 to-[#ff0032]/20 blur-3xl" />
              </div>

              {/* Robot stack (SVG illustration) */}
              <div className="relative flex flex-col items-center gap-3 float-slow">
                <RobotHead glow="#ff0032" />
                <RobotHead glow="#ff2a5e" />
                <RobotHead glow="#ff4070" />
              </div>

              {/* Capsule pill */}
              <div className="absolute bottom-8 left-4">
                <div className="relative h-10 w-28 rounded-full bg-gradient-to-r from-white to-gray-200 shadow-xl overflow-hidden">
                  <div className="absolute right-0 h-full w-1/2 bg-gradient-to-r from-[#ff0032] to-[#ff2a5e]" />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white/90" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features grid */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-purple)]/30 bg-[var(--color-purple)]/10 px-4 py-1.5 text-sm text-[var(--color-purple)] font-medium mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Возможности платформы
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-foreground)] mb-3">
            Всё что нужно для работы с{' '}
            <span className="bg-gradient-to-r from-[#7f3dff] to-[#ff0032] bg-clip-text text-transparent">
              AI
            </span>
          </h2>
          <p className="text-[var(--color-muted-foreground)]">
            Мощные возможности, красивый интерфейс
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} accent={i % 2 === 0 ? 'red' : 'purple'} />
          ))}
        </div>
      </div>

      {/* CTA bottom */}
      <div className="border-t border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-[var(--color-foreground)] mb-4">
            Готов инициировать будущее?
          </h2>
          <p className="text-[var(--color-muted-foreground)] mb-8">
            Начни использовать GPTHub прямо сейчас — без регистрации
          </p>
          <button
            onClick={handleStart}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#7f3dff] to-[#ff0032] px-8 py-4 text-base font-semibold text-white hover:opacity-90 transition-opacity shadow-xl shadow-[#7f3dff]/30"
          >
            Открыть GPTHub <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

/** Stylised robot head inspired by the MTS True Tech hack mascot */
function RobotHead({ glow }: { glow: string }) {
  return (
    <svg width="140" height="110" viewBox="0 0 140 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`body-${glow}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b2ea8" />
          <stop offset="1" stopColor="#2a0f5c" />
        </linearGradient>
        <radialGradient id={`eye-${glow}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor={glow} />
          <stop offset="1" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Body */}
      <rect x="15" y="20" width="110" height="75" rx="28" fill={`url(#body-${glow})`} stroke="#7f3dff" strokeWidth="1.5" />
      {/* Antenna */}
      <circle cx="70" cy="12" r="4" fill="#ff0032" />
      <line x1="70" y1="16" x2="70" y2="22" stroke="#7f3dff" strokeWidth="2" />
      {/* Screen */}
      <rect x="28" y="35" width="84" height="42" rx="16" fill="#1a0b3d" stroke="#9d5cff" strokeWidth="1" />
      {/* Eyes */}
      <circle cx="52" cy="56" r="10" fill={`url(#eye-${glow})`} />
      <circle cx="88" cy="56" r="10" fill={`url(#eye-${glow})`} />
      <circle cx="52" cy="56" r="4" fill={glow} />
      <circle cx="88" cy="56" r="4" fill={glow} />
      {/* Side bolts */}
      <circle cx="20" cy="57" r="3" fill="#7f3dff" />
      <circle cx="120" cy="57" r="3" fill="#7f3dff" />
    </svg>
  )
}
