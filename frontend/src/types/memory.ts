export type MemoryCategory = 'fact' | 'preference' | 'context'

export interface MemoryEntry {
  id: string
  content: string
  category: MemoryCategory
  createdAt: number
  relevance?: number
}
