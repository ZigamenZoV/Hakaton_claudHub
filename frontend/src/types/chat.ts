import type { FileAttachment } from './file'

export type Role = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  role: Role
  content: string
  model?: string
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
