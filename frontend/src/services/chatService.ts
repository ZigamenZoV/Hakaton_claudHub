import { request, streamRequest } from './api'
import type { Conversation, Message } from '@/types/chat'
import type { TaskCategory } from '@/lib/modelRouter'

export interface ChatRequestOptions {
  conversationId: string
  content: string
  model: string
  fileIds?: string[]
  imageUrl?: string
  taskCategory?: TaskCategory
  webSearch?: boolean
  researchMode?: boolean
  presentationMode?: boolean
}

export const chatService = {
  streamMessage(opts: ChatRequestOptions): AsyncGenerator<string> {
    return streamRequest('/chat/completions', {
      conversation_id: opts.conversationId,
      message: opts.content,
      model: opts.model,
      file_ids: opts.fileIds ?? [],
      image_url: opts.imageUrl ?? null,
      task_category: opts.taskCategory,
      web_search: opts.webSearch ?? false,
      research_mode: opts.researchMode ?? false,
      presentation_mode: opts.presentationMode ?? false,
    })
  },

  getConversations(): Promise<Conversation[]> {
    return request('/conversations')
  },

  getMessages(conversationId: string): Promise<Message[]> {
    return request(`/conversations/${conversationId}/messages`)
  },

  deleteConversation(conversationId: string): Promise<void> {
    return request(`/conversations/${conversationId}`, { method: 'DELETE' })
  },
}
