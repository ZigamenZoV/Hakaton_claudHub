import type { Message } from '@/types/chat'
import { MessageBubble } from './MessageBubble'

interface Props {
  messages: Message[]
  isStreaming: boolean
  streamingContent: string
  onRegenerate: (content: string) => void
}

export function MessageList({ messages, isStreaming, streamingContent, onRegenerate }: Props) {
  return (
    <div className="space-y-1 py-4">
      {messages.map((msg, idx) => {
        // Find the last user message before this assistant message
        let regenerateContent: string | undefined
        if (msg.role === 'assistant') {
          for (let i = idx - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
              regenerateContent = messages[i].content
              break
            }
          }
        }
        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            onRegenerate={regenerateContent ? () => onRegenerate(regenerateContent!) : undefined}
          />
        )
      })}
      {isStreaming && (
        <MessageBubble
          message={{ id: '__streaming__', role: 'assistant', content: '', timestamp: Date.now() }}
          isStreamingPlaceholder
          streamingContent={streamingContent}
        />
      )}
    </div>
  )
}
