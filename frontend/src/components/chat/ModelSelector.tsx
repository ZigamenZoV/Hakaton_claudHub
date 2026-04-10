import { BrainCircuit, ChevronDown, Zap } from 'lucide-react'
import { useModelStore } from '@/stores/modelStore'
import { AUTO_MODEL_ID, MODELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'

const PROVIDER_COLORS: Record<string, string> = {
  openai: 'text-emerald-400',
  ollama: 'text-[var(--color-purple)]',
}

export function ModelSelector() {
  const { selectedModelId, setSelectedModel } = useModelStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const currentName =
    selectedModelId === AUTO_MODEL_ID
      ? 'Auto'
      : MODELS.find((m) => m.id === selectedModelId)?.name ?? selectedModelId

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-all',
          'glass border border-white/10 hover:border-[var(--color-purple)]/40',
          open && 'border-[var(--color-purple)]/50 shadow-md shadow-[var(--color-purple)]/10'
        )}
      >
        <BrainCircuit className="h-4 w-4 text-[var(--color-purple)]" />
        <span className="font-medium">{currentName}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-[var(--color-muted-foreground)] transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl overflow-hidden
          glass border border-white/10 shadow-2xl shadow-black/40">
          {/* Auto option */}
          <button
            onClick={() => { setSelectedModel(AUTO_MODEL_ID); setOpen(false) }}
            className={cn(
              'flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors',
              'hover:bg-[var(--color-purple)]/10',
              selectedModelId === AUTO_MODEL_ID && 'bg-[var(--color-purple)]/15'
            )}
          >
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-purple)] flex items-center justify-center shrink-0">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="text-left">
              <div className="font-medium">Auto (Роутер)</div>
              <div className="text-xs text-[var(--color-muted-foreground)]">Лучшая модель для задачи</div>
            </div>
            {selectedModelId === AUTO_MODEL_ID && (
              <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--color-purple)]" />
            )}
          </button>

          <div className="h-px bg-white/5 mx-3" />

          {MODELS.map((model) => {
            const isSelected = selectedModelId === model.id
            return (
              <button
                key={model.id}
                onClick={() => { setSelectedModel(model.id); setOpen(false) }}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors',
                  'hover:bg-[var(--color-purple)]/10',
                  isSelected && 'bg-[var(--color-purple)]/15'
                )}
              >
                <div className="h-7 w-7 rounded-lg bg-[var(--color-purple)]/15 flex items-center justify-center shrink-0">
                  <BrainCircuit className="h-3.5 w-3.5 text-[var(--color-purple)]" />
                </div>
                <div className="flex-1 text-left">
                  <div>{model.name}</div>
                  <div className={cn('text-xs capitalize', PROVIDER_COLORS[model.provider] ?? 'text-[var(--color-muted-foreground)]')}>
                    {model.provider}
                  </div>
                </div>
                {isSelected && (
                  <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-purple)]" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
