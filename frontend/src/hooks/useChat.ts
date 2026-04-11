import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useChatStore } from '@/stores/chatStore'
import { useModelStore } from '@/stores/modelStore'
import { useFileStore } from '@/stores/fileStore'
import { useUIStore } from '@/stores/uiStore'
import { chatService } from '@/services/chatService'
import { fileService } from '@/services/fileService'
import { routeModel, getTaskCategory, getRouteLabel } from '@/lib/modelRouter'
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

  const webSearch = useUIStore((s) => s.webSearchEnabled)
  const researchMode = useUIStore((s) => s.researchModeEnabled)
  const presentationMode = useUIStore((s) => s.presentationModeEnabled)

  const send = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return

      // Ensure we have an active conversation
      let convId = activeConversationId
      if (!convId) {
        convId = createConversation()
        navigate(`/chat/${convId}`)
      }

      const modeOptions = { webSearch, researchMode, presentationMode }

      // Determine model & task category
      const model =
        selectedModelId === AUTO_MODEL_ID
          ? routeModel(content, pendingFiles, modeOptions)
          : selectedModelId

      const taskCategory = getTaskCategory(content, pendingFiles, modeOptions)

      // Upload files if any
      const uploadedFileIds: string[] = []
      const filesSnapshot = [...pendingFiles]
      clearFiles()

      // Extract image preview URL for VLM (first image attachment)
      let imageUrl: string | undefined
      for (const f of filesSnapshot) {
        if (f.type.startsWith('image/') && f.preview) {
          imageUrl = f.preview
          break
        }
      }

      for (const f of filesSnapshot) {
        if (!f.blob) continue
        // Skip image files from upload to /api/files — they go via image_url
        if (f.type.startsWith('image/')) continue
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
        taskCategory,
        timestamp: Date.now(),
      }
      addMessage(convId, userMsg)

      // Stream assistant response
      try {
        const stream = chatService.streamMessage({
          conversationId: convId,
          content,
          model,
          fileIds: uploadedFileIds,
          imageUrl,
          taskCategory,
          webSearch,
          researchMode,
          presentationMode,
        })
        for await (const chunk of stream) {
          updateStreamingContent(chunk)
        }
        finalizeStreaming(model, taskCategory)
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
      webSearch,
      researchMode,
      presentationMode,
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
