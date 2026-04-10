import { useNavigate, useParams } from 'react-router-dom'
import { Plus, MessageSquare, Trash2, Settings, X, Clock } from 'lucide-react'
import { MascotIcon } from '@/components/MascotIcon'
import { useChatStore } from '@/stores/chatStore'
import { cn, formatDate } from '@/lib/utils'
import type { Conversation } from '@/types/chat'

interface Props {
  onClose: () => void
}

function groupConversations(conversations: Conversation[]) {
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const weekStart = new Date(todayStart)
  weekStart.setDate(weekStart.getDate() - 7)

  const groups: { label: string; items: Conversation[] }[] = [
    { label: 'Сегодня', items: [] },
    { label: 'Вчера', items: [] },
    { label: 'На этой неделе', items: [] },
    { label: 'Раньше', items: [] },
  ]

  for (const conv of conversations) {
    const d = new Date(conv.updatedAt)
    d.setHours(0, 0, 0, 0)
    if (d >= todayStart) groups[0].items.push(conv)
    else if (d >= yesterdayStart) groups[1].items.push(conv)
    else if (d >= weekStart) groups[2].items.push(conv)
    else groups[3].items.push(conv)
  }

  return groups.filter((g) => g.items.length > 0)
}

export function Sidebar({ onClose }: Props) {
  const navigate = useNavigate()
  const { conversationId } = useParams()
  const { conversations, activeConversationId, createConversation, deleteConversation, setActiveConversation } =
    useChatStore()

  function handleNewChat() {
    const id = createConversation()
    navigate(`/chat/${id}`)
    onClose()
  }

  function handleSelect(id: string) {
    setActiveConversation(id)
    navigate(`/chat/${id}`)
    onClose()
  }

  const groups = groupConversations(conversations)

  return (
    <div className="flex h-full flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-sidebar-border)] bg-[var(--color-sidebar)]">
        <div className="flex items-center gap-3">
          <MascotIcon size={42} />
          <div>
            <p className="font-bold text-lg text-[var(--color-foreground)] leading-tight">GPTHub</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">Мои разговоры</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Закрыть"
          className="flex items-center justify-center h-10 w-10 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] text-[var(--color-muted-foreground)] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* New chat button */}
      <div className="px-4 py-3 border-b border-[var(--color-sidebar-border)]">
        <button
          onClick={handleNewChat}
          className="flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-4 text-base font-semibold
            bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30
            hover:opacity-90 active:scale-[.98] transition-all"
        >
          <Plus className="h-5 w-5" />
          Начать новый разговор
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <MessageSquare className="h-12 w-12 text-[var(--color-muted-foreground)]/40" />
            <p className="text-base text-[var(--color-muted-foreground)]">
              Разговоров пока нет.
            </p>
            <p className="text-sm text-[var(--color-muted-foreground)]/70">
              Нажмите кнопку выше, чтобы начать!
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.label}>
                <div className="flex items-center gap-2 px-2 mb-2">
                  <Clock className="h-4 w-4 text-[var(--color-purple)]/50" />
                  <p className="text-sm font-semibold text-[var(--color-purple)]/70">
                    {group.label}
                  </p>
                </div>
                <div className="space-y-1">
                  {group.items.map((conv) => {
                    const isActive = activeConversationId === conv.id || conversationId === conv.id
                    return (
                      <div
                        key={conv.id}
                        className={cn(
                          'group flex items-center gap-3 rounded-xl px-4 py-3.5 cursor-pointer transition-all min-h-[60px]',
                          isActive
                            ? 'bg-[var(--color-purple)]/15 border border-[var(--color-purple)]/30'
                            : 'hover:bg-[var(--color-accent)] border border-transparent'
                        )}
                        onClick={() => handleSelect(conv.id)}
                      >
                        <div className={cn(
                          'shrink-0 h-9 w-9 rounded-lg flex items-center justify-center',
                          isActive
                            ? 'bg-[var(--color-purple)]/20'
                            : 'bg-[var(--color-muted)]/60'
                        )}>
                          <MessageSquare className={cn(
                            'h-4 w-4',
                            isActive ? 'text-[var(--color-purple)]' : 'text-[var(--color-muted-foreground)]'
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-base font-medium text-[var(--color-foreground)] leading-snug">
                            {conv.title}
                          </p>
                          <p className="text-sm text-[var(--color-muted-foreground)] mt-0.5">
                            {formatDate(conv.updatedAt)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm('Удалить этот разговор?')) {
                              deleteConversation(conv.id)
                              if (activeConversationId === conv.id) navigate('/chat')
                            }
                          }}
                          className="shrink-0 flex items-center justify-center h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-[var(--color-destructive)]/15 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] transition-all"
                          aria-label="Удалить разговор"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--color-sidebar-border)]">
        <button
          onClick={() => { navigate('/settings'); onClose() }}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-base text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)] transition-colors"
        >
          <div className="h-9 w-9 rounded-lg bg-[var(--color-muted)]/60 flex items-center justify-center">
            <Settings className="h-4 w-4" />
          </div>
          <span className="font-medium">Настройки</span>
        </button>
      </div>
    </div>
  )
}
