import { Download, Brain, MessageSquare, Zap } from 'lucide-react'
import { MascotIcon } from '@/components/MascotIcon'
import { useUIStore } from '@/stores/uiStore'
import { useMemoryStore } from '@/stores/memoryStore'
import { ThemeToggle } from './ThemeToggle'
import { ModelSelector } from '@/components/chat/ModelSelector'
import { useLocation, useNavigate } from 'react-router-dom'
import { useChatStore } from '@/stores/chatStore'
import { useModelStore } from '@/stores/modelStore'
import { AUTO_MODEL_ID } from '@/lib/constants'
import { cn } from '@/lib/utils'

function exportChatToMarkdown(messages: { role: string; content: string; model?: string; timestamp: number }[]) {
  const lines = messages.map((m) => {
    const time = new Date(m.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    const prefix = m.role === 'user' ? '**Вы**' : `**GPTHub** (${m.model ?? 'auto'})`
    return `### ${prefix} — ${time}\n\n${m.content}\n`
  })
  const md = `# Экспорт чата GPTHub\n\n${lines.join('\n---\n\n')}`
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gpthub-chat-${Date.now()}.md`
  a.click()
  URL.revokeObjectURL(url)
}

export function Header() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const toggleMemoryPanel = useMemoryStore((s) => s.togglePanel)
  const memoryPanelOpen = useMemoryStore((s) => s.panelOpen)
  const memoryCount = useMemoryStore((s) => s.memories.length)
  const location = useLocation()
  const navigate = useNavigate()
  const { activeConversationId, conversations, messages } = useChatStore()
  const { selectedModelId } = useModelStore()
  const isChat = location.pathname.startsWith('/chat')
  const isAuto = selectedModelId === AUTO_MODEL_ID

  const currentMessages = activeConversationId ? messages[activeConversationId] ?? [] : []

  function handleLogoClick() {
    navigate('/')
  }

  return (
    <header className="glass flex items-center gap-2 px-4 border-b border-white/8 h-16 shrink-0 sticky top-0 z-30">

      {/* Chats toggle button */}
      <button
        onClick={toggleSidebar}
        aria-label="Открыть список разговоров"
        className={cn(
          'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all min-h-[44px]',
          sidebarOpen
            ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30'
            : 'bg-[var(--color-accent)] text-[var(--color-foreground)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]'
        )}
      >
        <MessageSquare className="h-5 w-5 shrink-0" />
        <span className="hidden sm:inline">Чаты</span>
      </button>

      {/* Logo (center or left) */}
      <button
        onClick={handleLogoClick}
        className="flex items-center gap-2 ml-1 hover:opacity-75 transition-opacity"
      >
        <MascotIcon size={34} />
        <span className="hidden md:block font-bold text-base text-[var(--color-foreground)]">GPTHub</span>
      </button>

      <div className="flex-1" />

      {/* Auto-routing badge */}
      {isChat && isAuto && (
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3 py-1.5">
          <Zap className="h-4 w-4 text-[var(--color-primary)]" />
          <span className="text-sm font-medium text-[var(--color-primary)]">Авто</span>
        </div>
      )}

      {isChat && <ModelSelector />}

      {/* Export chat */}
      {isChat && currentMessages.length > 0 && (
        <button
          onClick={() => exportChatToMarkdown(currentMessages)}
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)] transition-colors min-h-[44px]"
          aria-label="Сохранить чат"
          title="Сохранить чат в файл"
        >
          <Download className="h-5 w-5" />
          <span className="hidden sm:inline">Сохранить</span>
        </button>
      )}

      {/* Memory panel toggle */}
      {isChat && (
        <button
          onClick={toggleMemoryPanel}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all min-h-[44px]',
            memoryPanelOpen
              ? 'bg-[var(--color-purple)]/15 text-[var(--color-purple)] border border-[var(--color-purple)]/30'
              : 'bg-[var(--color-accent)] text-[var(--color-foreground)] hover:bg-[var(--color-purple)]/10 hover:text-[var(--color-purple)]'
          )}
          title="Память ИИ"
        >
          <Brain className="h-5 w-5 shrink-0" />
          <span className="hidden sm:inline">Память</span>
          {memoryCount > 0 && (
            <span className={cn(
              'flex items-center justify-center h-5 min-w-5 rounded-full text-xs font-bold px-1',
              memoryPanelOpen ? 'bg-[var(--color-purple)]/30 text-[var(--color-purple)]' : 'bg-[var(--color-purple)]/20 text-[var(--color-purple)]'
            )}>
              {memoryCount}
            </span>
          )}
        </button>
      )}

      <ThemeToggle />
    </header>
  )
}
