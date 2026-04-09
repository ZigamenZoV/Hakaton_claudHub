import { useState } from 'react'
import { BrainCircuit, User, Copy, Check } from 'lucide-react'
import type { Message } from '@/types/chat'
import { MessageContent } from './MessageContent'
import { StreamingIndicator } from './StreamingIndicator'
import { TTSPlayButton } from '@/components/voice/TTSPlayButton'
import { formatTimestamp } from '@/lib/utils'

interface Props {
  message: Message
  isStreamingPlaceholder?: boolean
  streamingContent?: string
}

export function MessageBubble({ message, isStreamingPlaceholder, streamingContent }: Props) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  function handleCopy() {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isUser) {
    return (
      <div className="group px-4 py-2">
        <div className="max-w-3xl mx-auto flex justify-end gap-2.5">
          <div className="flex flex-col items-end gap-1 max-w-[80%]">
            {message.files && message.files.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-end">
                {message.files.map((f) => (
                  <span
                    key={f.id}
                    className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-user-bubble)]/20 text-[var(--color-user-bubble)]"
                  >
                    📎 {f.name}
                  </span>
                ))}
              </div>
            )}
            <div className="rounded-2xl rounded-tr-sm bg-[var(--color-user-bubble)] text-[var(--color-user-bubble-foreground)] px-4 py-2.5 text-sm leading-relaxed">
              {message.content}
            </div>
            <span className="text-xs text-[var(--color-muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity">
              {formatTimestamp(message.timestamp)}
            </span>
          </div>
          <div className="shrink-0 h-7 w-7 rounded-full bg-[var(--color-user-bubble)] flex items-center justify-center mt-0.5 ring-2 ring-[var(--color-user-bubble)]/20">
            <User className="h-3.5 w-3.5 text-[var(--color-user-bubble-foreground)]" />
          </div>
        </div>
      </div>
    )
  }

  // Assistant — flat modern layout (no bubble background)
  return (
    <div className="group px-4 py-4 hover:bg-[var(--color-accent)]/30 transition-colors">
      <div className="max-w-3xl mx-auto flex gap-3">
        <div className="shrink-0 h-7 w-7 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mt-0.5 ring-1 ring-[var(--color-primary)]/20">
          <BrainCircuit className="h-3.5 w-3.5 text-[var(--color-primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="text-sm leading-relaxed text-[var(--color-foreground)]"
          >
            {isStreamingPlaceholder ? (
              streamingContent
                ? <MessageContent content={streamingContent} />
                : <StreamingIndicator />
            ) : (
              <MessageContent content={message.content} />
            )}
          </div>

          {!isStreamingPlaceholder && (
            <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {message.model && (
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {message.model}
                </span>
              )}
              <span className="text-xs text-[var(--color-muted-foreground)]">
                {formatTimestamp(message.timestamp)}
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)] transition-colors"
                aria-label="Копировать"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
              <TTSPlayButton messageId={message.id} text={message.content} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
