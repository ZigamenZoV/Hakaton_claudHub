import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--color-background)]">
      {/* Sidebar — hidden on mobile, visible on desktop */}
      <aside
        className={cn(
          'hidden md:flex flex-col shrink-0 border-r border-[var(--color-sidebar-border)] bg-[var(--color-sidebar)] transition-all duration-200',
          sidebarOpen ? 'w-64' : 'w-0 overflow-hidden border-none'
        )}
      >
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => useUIStore.getState().setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[var(--color-sidebar-border)] bg-[var(--color-sidebar)] transition-transform duration-200 md:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar />
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
