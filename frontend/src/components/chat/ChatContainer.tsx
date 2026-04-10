import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useChatStore } from '@/stores/chatStore'
import { useChat } from '@/hooks/useChat'
import { useScrollToBottom } from '@/hooks/useScrollToBottom'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { WelcomePrompts } from './WelcomePrompts'

export function ChatContainer() {
  const { conversationId } = useParams()
  const { messages, activeConversationId, setActiveConversation, isStreaming, streamingContent } =
    useChatStore()
  const { send } = useChat()

  // Sync active conversation from URL
  useEffect(() => {
    if (conversationId && conversationId !== activeConversationId) {
      setActiveConversation(conversationId)
    }
  }, [conversationId, activeConversationId, setActiveConversation])

  const currentMessages = (activeConversationId ? messages[activeConversationId] : null) ?? []
  const scrollRef = useScrollToBottom<HTMLDivElement>(
    isStreaming ? streamingContent : currentMessages.length
  )

  const isEmpty = currentMessages.length === 0 && !isStreaming

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <WelcomePrompts onSelect={(text) => send(text)} />
        ) : (
          <MessageList
            messages={currentMessages}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
            onRegenerate={send}
          />
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={send} isStreaming={isStreaming} />
    </div>
  )
}
