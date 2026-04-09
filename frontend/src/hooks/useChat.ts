import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatStore } from '@/stores/chatStore'
import { useModelStore } from '@/stores/modelStore'
import { useFileStore } from '@/stores/fileStore'
import { chatService } from '@/services/chatService'
import { fileService } from '@/services/fileService'
import { routeModel } from '@/lib/modelRouter'
import { AUTO_MODEL_ID } from '@/lib/constants'
import { generateId } from '@/lib/utils'
import type { Message } from '@/types/chat'

export function useChat() {
  const navigate = useNavigate()
  const {
    activeConversationId,
    createConversation,
    addMessage,
    updateStreamingContent,
    finalizeStreaming,
    clearStreaming,
    isStreaming,
    streamingContent,
  } = useChatStore()

  const { selectedModelId } = useModelStore()
  const { pendingFiles, clearFiles, updateFileStatus } = useFileStore()

  const send = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return

      // Ensure we have an active conversation
      let convId = activeConversationId
      if (!convId) {
        convId = createConversation()
        navigate(`/chat/${convId}`)
      }

      // Determine model
      const model =
        selectedModelId === AUTO_MODEL_ID
          ? routeModel(content, pendingFiles)
          : selectedModelId

      // Upload files if any
      const uploadedFileIds: string[] = []
      const filesSnapshot = [...pendingFiles]
      clearFiles()

      for (const f of filesSnapshot) {
        if (!f.blob) continue
        try {
          updateFileStatus(f.id, 'uploading')
          const uploaded = await fileService.uploadFile(f.blob)
          uploadedFileIds.push(uploaded.id)
          updateFileStatus(f.id, 'uploaded')
        } catch {
          updateFileStatus(f.id, 'error')
        }
      }

      // Add user message to store
      const userMsg: Message = {
        id: generateId(),
        role: 'user',
        content,
        files: filesSnapshot,
        timestamp: Date.now(),
      }
      addMessage(convId, userMsg)

      // Stream assistant response
      try {
        const stream = chatService.streamMessage(
          convId,
          content,
          model,
          uploadedFileIds
        )
        for await (const chunk of stream) {
          updateStreamingContent(chunk)
        }
        finalizeStreaming(model)
      } catch (err) {
        console.error('Chat error:', err)
        clearStreaming()
      }
    },
    [
      activeConversationId,
      isStreaming,
      selectedModelId,
      pendingFiles,
      navigate,
      createConversation,
      addMessage,
      updateStreamingContent,
      finalizeStreaming,
      clearStreaming,
      clearFiles,
      updateFileStatus,
    ]
  )

  return { send, isStreaming, streamingContent }
}
