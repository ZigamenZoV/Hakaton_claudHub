import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { LandingPage } from '@/pages/LandingPage'
import { ChatPage } from '@/pages/ChatPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { AppLayout } from '@/components/layout/AppLayout'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { useChatStore } from '@/stores/chatStore'

function KeyboardShortcuts() {
  const navigate = useNavigate()
  const { createConversation } = useChatStore()

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Ctrl+N / Cmd+N — new chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        const id = createConversation()
        navigate(`/chat/${id}`)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate, createConversation])

  return null
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <KeyboardShortcuts />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<AppLayout />}>
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:conversationId" element={<ChatPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
