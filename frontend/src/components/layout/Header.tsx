import { Menu, BrainCircuit } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { ThemeToggle } from './ThemeToggle'
import { ModelSelector } from '@/components/chat/ModelSelector'
import { useLocation, useNavigate } from 'react-router-dom'
import { useChatStore } from '@/stores/chatStore'

export function Header() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const location = useLocation()
  const navigate = useNavigate()
  const { createConversation } = useChatStore()
  const isChat = location.pathname.startsWith('/chat')

  function handleLogoClick() {
    const id = createConversation()
    navigate(`/chat/${id}`)
  }

  return (
    <header className="flex items-center gap-2 px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-background)] h-14 shrink-0">
      <button
        onClick={toggleSidebar}
        className="inline-flex items-center justify-center rounded-md p-2 text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)] transition-colors"
        aria-label="Переключить боковую панель"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile logo */}
      <button onClick={handleLogoClick} className="flex items-center gap-1.5 md:hidden hover:opacity-80 transition-opacity">
        <BrainCircuit className="h-5 w-5 text-[var(--color-primary)]" />
        <span className="font-bold text-[var(--color-foreground)]">GPTHub</span>
      </button>

      <div className="flex-1" />

      {isChat && <ModelSelector />}

      <ThemeToggle />
    </header>
  )
}
