import { Code, FileText, Image, Mic, Search, Sparkles } from 'lucide-react'

const PROMPTS = [
  { icon: Code, label: 'Напиши код', text: 'Напиши функцию на Python для сортировки списка объектов по полю' },
  { icon: FileText, label: 'Суммаризуй документ', text: 'Загрузи файл и я его проанализирую' },
  { icon: Image, label: 'Сгенерируй картинку', text: 'Нарисуй котёнка в стиле аниме на фоне заката' },
  { icon: Search, label: 'Объясни концепцию', text: 'Объясни разницу между REST и GraphQL простыми словами' },
  { icon: Sparkles, label: 'Придумай идею', text: 'Придумай 5 идей для стартапа в области AI-инструментов' },
  { icon: Mic, label: 'Голосовой ввод', text: 'Попробуй нажать на иконку микрофона и говори голосом' },
]

interface Props {
  onSelect: (text: string) => void
}

export function WelcomePrompts({ onSelect }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-[var(--color-primary)]/10 mb-4">
          <Sparkles className="h-8 w-8 text-[var(--color-primary)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-foreground)] mb-1">Как я могу помочь?</h2>
        <p className="text-[var(--color-muted-foreground)] text-sm max-w-sm">
          Задай любой вопрос, загрузи файл или изображение, используй голосовой ввод
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl w-full">
        {PROMPTS.map(({ icon: Icon, label, text }) => (
          <button
            key={label}
            onClick={() => onSelect(text)}
            className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-left hover:bg-[var(--color-accent)] hover:border-[var(--color-primary)]/30 transition-all group"
          >
            <div className="shrink-0 mt-0.5 h-8 w-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center group-hover:bg-[var(--color-primary)]/20 transition-colors">
              <Icon className="h-4 w-4 text-[var(--color-primary)]" />
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--color-foreground)]">{label}</div>
              <div className="text-xs text-[var(--color-muted-foreground)] mt-0.5 line-clamp-2">{text}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
