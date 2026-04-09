import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Conversation, Message } from '@/types/chat'
import { generateId } from '@/lib/utils'

interface ChatState {
  conversations: Conversation[]
  activeConversationId: string | null
  messages: Record<string, Message[]>
  isStreaming: boolean
  streamingContent: string

  createConversation: () => string
  setActiveConversation: (id: string | null) => void
  addMessage: (conversationId: string, message: Message) => void
  updateStreamingContent: (chunk: string) => void
  finalizeStreaming: (model?: string) => void
  deleteConversation: (id: string) => void
  renameConversation: (id: string, title: string) => void
  clearStreaming: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      messages: {},
      isStreaming: false,
      streamingContent: '',

      createConversation: () => {
        const id = generateId()
        const conversation: Conversation = {
          id,
          title: 'Новый чат',
          model: 'auto',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((s) => ({
          conversations: [conversation, ...s.conversations],
          activeConversationId: id,
          messages: { ...s.messages, [id]: [] },
        }))
        return id
      },

      setActiveConversation: (id) => set({ activeConversationId: id }),

      addMessage: (conversationId, message) => {
        set((s) => {
          const msgs = s.messages[conversationId] || []
          const convs = s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  title:
                    c.title === 'Новый чат' && message.role === 'user'
                      ? message.content.slice(0, 40) + (message.content.length > 40 ? '...' : '')
                      : c.title,
                }
              : c
          )
          return {
            messages: { ...s.messages, [conversationId]: [...msgs, message] },
            conversations: convs,
          }
        })
      },

      updateStreamingContent: (chunk) => {
        set((s) => ({
          isStreaming: true,
          streamingContent: s.streamingContent + chunk,
        }))
      },

      finalizeStreaming: (model) => {
        const { activeConversationId, streamingContent } = get()
        if (!activeConversationId || !streamingContent) {
          set({ isStreaming: false, streamingContent: '' })
          return
        }
        const message: Message = {
          id: generateId(),
          role: 'assistant',
          content: streamingContent,
          model,
          timestamp: Date.now(),
        }
        get().addMessage(activeConversationId, message)
        set({ isStreaming: false, streamingContent: '' })
      },

      clearStreaming: () => set({ isStreaming: false, streamingContent: '' }),

      deleteConversation: (id) => {
        set((s) => {
          const { [id]: _, ...restMessages } = s.messages
          const conversations = s.conversations.filter((c) => c.id !== id)
          return {
            conversations,
            messages: restMessages,
            activeConversationId:
              s.activeConversationId === id ? null : s.activeConversationId,
          }
        })
      },

      renameConversation: (id, title) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, title } : c
          ),
        }))
      },
    }),
    {
      name: 'gpthub-chat',
      partialize: (state) => ({
        conversations: state.conversations,
        messages: state.messages,
      }),
    }
  )
)
