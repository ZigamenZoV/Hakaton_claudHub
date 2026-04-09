import { Trash2 } from 'lucide-react'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { useMemoryStore } from '@/stores/memoryStore'
import { useModelStore } from '@/stores/modelStore'
import { MODELS, AUTO_MODEL_ID } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

export function SettingsPage() {
  const { memories, removeMemory, clearMemories } = useMemoryStore()
  const { selectedModelId, setSelectedModel } = useModelStore()

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-10">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Настройки</h1>

        {/* Appearance */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-[var(--color-foreground)]">Внешний вид</h2>
          <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <div>
              <div className="font-medium text-[var(--color-foreground)]">Тема</div>
              <div className="text-sm text-[var(--color-muted-foreground)]">Переключить светлую / тёмную тему</div>
            </div>
            <ThemeToggle />
          </div>
        </section>

        {/* Default model */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-[var(--color-foreground)]">Модель по умолчанию</h2>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden divide-y divide-[var(--color-border)]">
            <button
              onClick={() => setSelectedModel(AUTO_MODEL_ID)}
              className={cn(
                'flex w-full items-center justify-between px-4 py-3 hover:bg-[var(--color-accent)] transition-colors text-left',
                selectedModelId === AUTO_MODEL_ID && 'bg-[var(--color-primary)]/10'
              )}
            >
              <div>
                <div className="font-medium text-[var(--color-foreground)]">Auto (Роутер)</div>
                <div className="text-sm text-[var(--color-muted-foreground)]">Автоматический выбор лучшей модели</div>
              </div>
              {selectedModelId === AUTO_MODEL_ID && (
                <span className="text-xs font-medium text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-full">
                  Активна
                </span>
              )}
            </button>
            {MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                className={cn(
                  'flex w-full items-center justify-between px-4 py-3 hover:bg-[var(--color-accent)] transition-colors text-left',
                  selectedModelId === m.id && 'bg-[var(--color-primary)]/10'
                )}
              >
                <div>
                  <div className="font-medium text-[var(--color-foreground)]">{m.name}</div>
                  <div className="text-sm text-[var(--color-muted-foreground)] capitalize">{m.provider}</div>
                </div>
                {selectedModelId === m.id && (
                  <span className="text-xs font-medium text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-full">
                    Активна
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Memory */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              Долгосрочная память
              <span className="ml-2 text-sm font-normal text-[var(--color-muted-foreground)]">
                {memories.length} записей
              </span>
            </h2>
            {memories.length > 0 && (
              <button
                onClick={clearMemories}
                className="text-sm text-[var(--color-destructive)] hover:opacity-80 transition-opacity"
              >
                Очистить всё
              </button>
            )}
          </div>

          {memories.length === 0 ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
              Пока нет сохранённых воспоминаний. Они появятся по мере общения.
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden divide-y divide-[var(--color-border)]">
              {memories.map((m) => (
                <div key={m.id} className="flex items-start justify-between gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-foreground)]">{m.content}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                      {m.category} · {formatDate(m.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeMemory(m.id)}
                    className="shrink-0 rounded p-1 hover:bg-[var(--color-destructive)]/20 hover:text-[var(--color-destructive)] text-[var(--color-muted-foreground)] transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
