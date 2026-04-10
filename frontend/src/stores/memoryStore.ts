import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MemoryEntry, MemoryCategory } from '@/types/memory'
import { generateId } from '@/lib/utils'

interface MemoryState {
  memories: MemoryEntry[]
  panelOpen: boolean
  addMemory: (content: string, category: MemoryCategory) => void
  removeMemory: (id: string) => void
  clearMemories: () => void
  togglePanel: () => void
  setPanelOpen: (open: boolean) => void
}

const SEED_MEMORIES: MemoryEntry[] = [
  { id: generateId(), content: 'Зовут Карп, работает в команде МТС', category: 'profile', createdAt: Date.now() - 86400000 },
  { id: generateId(), content: 'Разрабатывает GPTHub — унифицированное AI-рабочее пространство', category: 'project', createdAt: Date.now() - 72000000 },
  { id: generateId(), content: '4 человека: 2 ML, 1 frontend, 1 backend', category: 'team', createdAt: Date.now() - 60000000 },
  { id: generateId(), content: '15 апреля 10:00 — сдача хакатона True Tech', category: 'deadline', createdAt: Date.now() - 50000000 },
  { id: generateId(), content: 'Форк OpenWebUI, MWS GPT, Mem0, Docker Compose', category: 'stack', createdAt: Date.now() - 40000000 },
  { id: generateId(), content: 'Любит короткие ответы и тёмную тему', category: 'preference', createdAt: Date.now() - 30000000 },
  { id: generateId(), content: 'Ранее обсуждали конкурентов и рыночные тренды', category: 'context', createdAt: Date.now() - 20000000 },
]

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set, get) => ({
      memories: SEED_MEMORIES,
      panelOpen: true,

      addMemory: (content, category) =>
        set((s) => ({
          memories: [
            ...s.memories,
            { id: generateId(), content, category, createdAt: Date.now() },
          ],
        })),

      removeMemory: (id) =>
        set((s) => ({ memories: s.memories.filter((m) => m.id !== id) })),

      clearMemories: () => set({ memories: [] }),

      togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
      setPanelOpen: (open) => set({ panelOpen: open }),
    }),
    {
      name: 'gpthub-memory',
      partialize: (state) => ({
        memories: state.memories,
        panelOpen: state.panelOpen,
      }),
    }
  )
)
