import { useNavigate, useParams } from 'react-router-dom'
import { Plus, MessageSquare, Trash2, BrainCircuit, Settings } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import { cn, formatDate } from '@/lib/utils'
import type { Conversation } from '@/types/chat'

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
    { label: 'Ранее', items: [] },
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

export function Sidebar() {
  const navigate = useNavigate()
  const { conversationId } = useParams()
  const { conversations, activeConversationId, createConversation, deleteConversation, setActiveConversation } =
    useChatStore()

  function handleNewChat() {
    const id = createConversation()
    navigate(`/chat/${id}`)
  }

  function handleSelect(id: string) {
    setActiveConversation(id)
    navigate(`/chat/${id}`)
  }

  const groups = groupConversations(conversations)

  return (
    <div className="flex h-full flex-col">
      {/* Logo + New Chat */}
      <div className="p-3 border-b border-[var(--color-sidebar-border)]">
        <button
          onClick={handleNewChat}
          className="flex items-center gap-2 px-2 mb-3 hover:opacity-80 transition-opacity"
        >
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[#ff5030] flex items-center justify-center">
            <BrainCircuit className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-[var(--color-foreground)]">GPTHub</span>
        </button>
        <button
          onClick={handleNewChat}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Новый чат
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <p className="px-3 py-8 text-xs text-[var(--color-muted-foreground)] text-center">
            Нет диалогов. Начни новый чат!
          </p>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]/60">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((conv) => (
                    <div
                      key={conv.id}
                      className={cn(
                        'group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer hover:bg-[var(--color-accent)] transition-colors',
                        (activeConversationId === conv.id || conversationId === conv.id) &&
                          'bg-[var(--color-accent)]'
                      )}
                      onClick={() => handleSelect(conv.id)}
                    >
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-[var(--color-muted-foreground)]" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm text-[var(--color-foreground)]">{conv.title}</p>
                        <p className="text-[11px] text-[var(--color-muted-foreground)]">{formatDate(conv.updatedAt)}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteConversation(conv.id)
                          if (activeConversationId === conv.id) navigate('/chat')
                        }}
                        className="shrink-0 opacity-0 group-hover:opacity-100 rounded p-1 hover:bg-[var(--color-destructive)]/20 text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)] transition-all"
                        aria-label="Удалить"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-[var(--color-sidebar-border)]">
        <button
          onClick={() => navigate('/settings')}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)] transition-colors"
        >
          <Settings className="h-4 w-4" />
          Настройки
        </button>
      </div>
    </div>
  )
}
