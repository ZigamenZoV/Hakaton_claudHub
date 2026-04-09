import type { Message } from '@/types/chat'
import { MessageBubble } from './MessageBubble'

interface Props {
  messages: Message[]
  isStreaming: boolean
  streamingContent: string
}

export function MessageList({ messages, isStreaming, streamingContent }: Props) {
  return (
    <div className="space-y-1 py-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
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
