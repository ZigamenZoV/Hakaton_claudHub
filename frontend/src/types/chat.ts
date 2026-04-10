import type { FileAttachment } from './file'
import type { TaskCategory } from '@/lib/modelRouter'

export type Role = 'user' | 'assistant' | 'system'

/** Structured content blocks for rich assistant messages */
export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; url: string; alt?: string }
  | { type: 'search_results'; query: string; results: SearchResult[] }
  | { type: 'research_step'; title: string; detail: string; status: 'running' | 'done' }
  | { type: 'url_preview'; url: string; title?: string; description?: string; image?: string }

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

export interface Message {
  id: string
  role: Role
  content: string
  /** Rich content blocks (images, search results, etc.) */
  blocks?: ContentBlock[]
  model?: string
  taskCategory?: TaskCategory
  files?: FileAttachment[]
  images?: string[]
  timestamp: number
}

export interface Conversation {
  id: string
  title: string
  model: string
  createdAt: number
  updatedAt: number
}
