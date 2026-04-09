import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MemoryEntry } from '@/types/memory'
import { generateId } from '@/lib/utils'

interface MemoryState {
  memories: MemoryEntry[]
  addMemory: (content: string, category: MemoryEntry['category']) => void
  removeMemory: (id: string) => void
  clearMemories: () => void
}

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set) => ({
      memories: [],

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
    }),
    { name: 'gpthub-memory' }
  )
)
