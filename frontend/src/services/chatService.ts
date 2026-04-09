import { request, streamRequest } from './api'
import type { Conversation, Message } from '@/types/chat'

export const chatService = {
  streamMessage(
    conversationId: string,
    content: string,
    model: string,
    fileIds: string[] = []
  ): AsyncGenerator<string> {
    return streamRequest('/chat/completions', {
      conversation_id: conversationId,
      message: content,
      model,
      file_ids: fileIds,
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
