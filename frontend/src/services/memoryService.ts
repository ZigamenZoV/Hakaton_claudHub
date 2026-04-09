import { request } from './api'
import type { MemoryEntry } from '@/types/memory'

export const memoryService = {
  search(query: string): Promise<MemoryEntry[]> {
    return request(`/memory?query=${encodeURIComponent(query)}`)
  },

  add(content: string, category: MemoryEntry['category']): Promise<MemoryEntry> {
    return request('/memory', {
      method: 'POST',
      body: JSON.stringify({ content, category }),
    })
  },

  delete(id: string): Promise<void> {
    return request(`/memory/${id}`, { method: 'DELETE' })
  },
}
