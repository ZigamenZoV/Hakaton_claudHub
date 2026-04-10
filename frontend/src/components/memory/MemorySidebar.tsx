import { Brain, X, Trash2, Info } from 'lucide-react'
import { useMemoryStore } from '@/stores/memoryStore'
import { MEMORY_CATEGORY_LABELS, MEMORY_CATEGORY_COLORS } from '@/types/memory'
import { cn } from '@/lib/utils'

export function MemorySidebar() {
  const { memories, removeMemory, togglePanel } = useMemoryStore()

  return (
    <div className="flex h-full flex-col bg-[var(--color-sidebar)]">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-sidebar-border)] sticky top-0 bg-[var(--color-sidebar)] z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[var(--color-purple)]/20 flex items-center justify-center">
            <Brain className="h-5 w-5 text-[var(--color-purple)]" />
          </div>
          <div>
            <p className="font-bold text-lg text-[var(--color-foreground)] leading-tight">Память</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {memories.length === 0
                ? 'Пока пусто'
                : `${memories.length} ${memories.length === 1 ? 'запись' : memories.length < 5 ? 'записи' : 'записей'}`}
            </p>
          </div>
        </div>
        <button
          onClick={togglePanel}
          aria-label="Закрыть панель памяти"
          className="flex items-center justify-center h-10 w-10 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-purple)]/10 hover:text-[var(--color-purple)] text-[var(--color-muted-foreground)] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Info banner */}
      <div className="mx-4 mt-4 mb-1 flex items-start gap-3 rounded-xl bg-[var(--color-purple)]/10 border border-[var(--color-purple)]/20 px-4 py-3">
        <Info className="h-5 w-5 text-[var(--color-purple)] shrink-0 mt-0.5" />
        <p className="text-sm text-[var(--color-foreground)]/80 leading-relaxed">
          Здесь хранится то, что ИИ запомнил о вас — ваши предпочтения и важная информация.
        </p>
      </div>

      {/* Memory cards */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-[var(--color-purple)]/10 flex items-center justify-center">
              <Brain className="h-8 w-8 text-[var(--color-purple)]/40" />
            </div>
            <div>
              <p className="text-base font-medium text-[var(--color-foreground)]">
                Память пока пуста
              </p>
              <p className="text-sm text-[var(--color-muted-foreground)] mt-1 leading-relaxed">
                Когда вы пообщаетесь с ИИ, он запомнит важные детали о вас.
              </p>
            </div>
          </div>
        ) : (
          memories.map((m) => {
            const colors = MEMORY_CATEGORY_COLORS[m.category]
            const label = MEMORY_CATEGORY_LABELS[m.category]
            return (
              <div
                key={m.id}
                className={cn(
                  'rounded-2xl border px-4 py-4 relative',
                  colors
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold tracking-wide text-[var(--color-foreground)]/70">
                    {label}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm('Удалить эту запись из памяти?')) removeMemory(m.id)
                    }}
                    className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-[var(--color-destructive)]/15 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] transition-colors"
                    aria-label="Удалить из памяти"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-base text-[var(--color-foreground)] leading-relaxed">
                  {m.content}
                </p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
