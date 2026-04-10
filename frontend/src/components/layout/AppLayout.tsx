import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MemorySidebar } from '@/components/memory/MemorySidebar'
import { useUIStore } from '@/stores/uiStore'
import { useMemoryStore } from '@/stores/memoryStore'

export function AppLayout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)
  const memoryPanelOpen = useMemoryStore((s) => s.panelOpen)
  const toggleMemoryPanel = useMemoryStore((s) => s.togglePanel)
  const location = useLocation()
  const isChat = location.pathname.startsWith('/chat')

  return (
    <div className="relative flex h-dvh overflow-hidden bg-[var(--color-background)]">

      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[var(--color-purple)]/20 blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] rounded-full bg-[var(--color-primary)]/15 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/3 w-[450px] h-[450px] rounded-full bg-[var(--color-purple)]/15 blur-[120px]" />
      </div>

      {/* ── Chat sidebar drawer (left) ── */}
      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Drawer */}
      <aside
        style={{ transition: 'transform 0.25s cubic-bezier(.4,0,.2,1)' }}
        className={[
          'fixed inset-y-0 left-0 z-50 flex flex-col w-[320px] max-w-[90vw]',
          'bg-[var(--color-sidebar)] border-r border-[var(--color-sidebar-border)]',
          'shadow-2xl shadow-black/40',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* ── Memory sidebar drawer (right) ── */}
      {memoryPanelOpen && isChat && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={toggleMemoryPanel}
        />
      )}
      <aside
        style={{ transition: 'transform 0.25s cubic-bezier(.4,0,.2,1)' }}
        className={[
          'fixed inset-y-0 right-0 z-50 flex flex-col w-[340px] max-w-[92vw]',
          'bg-[var(--color-sidebar)] border-l border-[var(--color-sidebar-border)]',
          'shadow-2xl shadow-black/40',
          isChat && memoryPanelOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <MemorySidebar />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
