import { BrainCircuit, ChevronDown } from 'lucide-react'
import { useModelStore } from '@/stores/modelStore'
import { AUTO_MODEL_ID, MODELS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'

export function ModelSelector() {
  const { selectedModelId, setSelectedModel } = useModelStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const currentName =
    selectedModelId === AUTO_MODEL_ID
      ? 'Auto (Роутер)'
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
          'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm border border-[var(--color-border)] bg-[var(--color-background)] hover:bg-[var(--color-accent)] transition-colors',
          open && 'bg-[var(--color-accent)]'
        )}
      >
        <BrainCircuit className="h-4 w-4 text-[var(--color-primary)]" />
        <span className="font-medium">{currentName}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-[var(--color-muted-foreground)] transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-lg border border-[var(--color-border)] bg-[var(--color-popover)] shadow-lg overflow-hidden">
          {/* Auto option */}
          <button
            onClick={() => { setSelectedModel(AUTO_MODEL_ID); setOpen(false) }}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-accent)] transition-colors',
              selectedModelId === AUTO_MODEL_ID && 'bg-[var(--color-accent)] font-medium'
            )}
          >
            <BrainCircuit className="h-4 w-4 text-[var(--color-primary)]" />
            <div>
              <div>Auto (Роутер)</div>
              <div className="text-xs text-[var(--color-muted-foreground)]">Выбор модели автоматически</div>
            </div>
          </button>
          <div className="h-px bg-[var(--color-border)] mx-2" />
          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => { setSelectedModel(model.id); setOpen(false) }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-accent)] transition-colors',
                selectedModelId === model.id && 'bg-[var(--color-accent)] font-medium'
              )}
            >
              <div className="flex-1 text-left">
                <div>{model.name}</div>
                <div className="text-xs text-[var(--color-muted-foreground)] capitalize">{model.provider}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
