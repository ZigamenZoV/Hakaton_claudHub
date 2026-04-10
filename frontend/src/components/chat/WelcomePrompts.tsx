import {
  Code, FileText, Image, Mic, Globe, Sparkles,
  FlaskConical, Presentation, Brain, Link,
} from 'lucide-react'

const PROMPTS = [
  { icon: Code, label: 'Напиши код', text: 'Напиши функцию на Python для сортировки списка объектов по полю', accent: 'sky' },
  { icon: Mic, label: 'Голосовой ввод', text: 'Нажми на микрофон и задай вопрос голосом', accent: 'red' },
  { icon: Image, label: 'Сгенерируй картинку', text: 'Нарисуй котёнка в стиле аниме на фоне заката', accent: 'pink' },
  { icon: FileText, label: 'Анализ файлов', text: 'Загрузи PDF, DOCX или CSV — я проанализирую содержимое', accent: 'orange' },
  { icon: Globe, label: 'Поиск в интернете', text: 'Найди последние новости про искусственный интеллект', accent: 'purple' },
  { icon: Link, label: 'Парсинг ссылки', text: 'Прочитай содержимое этой страницы https://example.com', accent: 'purple' },
  { icon: Brain, label: 'Память', text: 'Что ты помнишь обо мне?', accent: 'cyan' },
  { icon: FlaskConical, label: 'Deep Research', text: 'Проведи глубокий анализ трендов в AI за 2025 год', accent: 'emerald' },
  { icon: Presentation, label: 'Презентация', text: 'Сделай презентацию на тему "Будущее AI" на 5 слайдов', accent: 'amber' },
  { icon: Sparkles, label: 'Придумай идею', text: 'Придумай 5 идей для стартапа в области AI-инструментов', accent: 'red' },
]

const ACCENT_CLASSES: Record<string, string> = {
  sky: 'text-sky-400 bg-sky-500/10 group-hover:bg-sky-500/20',
  red: 'text-[var(--color-primary)] bg-[var(--color-primary)]/10 group-hover:bg-[var(--color-primary)]/20',
  pink: 'text-pink-400 bg-pink-500/10 group-hover:bg-pink-500/20',
  orange: 'text-orange-400 bg-orange-500/10 group-hover:bg-orange-500/20',
  purple: 'text-[var(--color-purple)] bg-[var(--color-purple)]/10 group-hover:bg-[var(--color-purple)]/20',
  cyan: 'text-cyan-400 bg-cyan-500/10 group-hover:bg-cyan-500/20',
  emerald: 'text-emerald-400 bg-emerald-500/10 group-hover:bg-emerald-500/20',
  amber: 'text-amber-400 bg-amber-500/10 group-hover:bg-amber-500/20',
}

interface Props {
  onSelect: (text: string) => void
}

export function WelcomePrompts({ onSelect }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-purple)]/20 mb-4">
          <Sparkles className="h-8 w-8 text-[var(--color-primary)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-foreground)] mb-1">Как я могу помочь?</h2>
        <p className="text-[var(--color-muted-foreground)] text-sm max-w-md">
          Текст, голос, изображения, файлы, поиск в интернете, Deep Research, презентации — всё в одном месте
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 max-w-4xl w-full">
        {PROMPTS.map(({ icon: Icon, label, text, accent }) => (
          <button
            key={label}
            onClick={() => onSelect(text)}
            className="flex items-start gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-left hover:border-[var(--color-purple)]/30 transition-all group"
          >
            <div className={`shrink-0 mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${ACCENT_CLASSES[accent]}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--color-foreground)]">{label}</div>
              <div className="text-xs text-[var(--color-muted-foreground)] mt-0.5 line-clamp-2">{text}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
