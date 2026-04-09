import { useRef, useState, useCallback, type KeyboardEvent } from 'react'
import { Send, Paperclip } from 'lucide-react'
import { useAutoResize } from '@/hooks/useAutoResize'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useVoiceRecording } from '@/hooks/useVoiceRecording'
import { FilePreview } from '@/components/file/FilePreview'
import { VoiceRecordButton } from '@/components/voice/VoiceRecordButton'
import { cn } from '@/lib/utils'
import { ACCEPTED_FILE_TYPES } from '@/types/file'

interface Props {
  onSend: (text: string) => void
  isStreaming: boolean
}

export function ChatInput({ onSend, isStreaming }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  useAutoResize(textareaRef, value)

  const { addFiles, removeFile, pendingFiles } = useFileUpload()

  const onTranscribed = useCallback(
    (text: string) => setValue((v) => v ? `${v} ${text}` : text),
    []
  )
  const { isRecording, isTranscribing, toggleRecording } = useVoiceRecording(onTranscribed)

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  const canSend = value.trim().length > 0 && !isStreaming

  return (
    <div
      className="px-4 pb-4 pt-2 max-w-3xl mx-auto w-full"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragging(false)}
    >
      <div
        className={cn(
          'relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] transition-all',
          isDragging && 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20',
          isRecording && 'border-red-400 ring-2 ring-red-400/20'
        )}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 pointer-events-none">
            <p className="text-sm font-medium text-[var(--color-primary)]">Перетащи файлы сюда</p>
          </div>
        )}

        {/* File previews */}
        <FilePreview files={pendingFiles} onRemove={removeFile} />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? 'Запись...' : 'Напиши сообщение... (Enter — отправить, Shift+Enter — новая строка)'}
          rows={1}
          disabled={isRecording || isTranscribing}
          className="w-full resize-none bg-transparent px-4 pt-3 pb-2 text-sm outline-none placeholder:text-[var(--color-muted-foreground)] text-[var(--color-foreground)] min-h-[52px] max-h-[200px] disabled:opacity-60"
        />

        {/* Actions row */}
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-1">
            {/* Attach file */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center rounded-lg p-2 text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)] transition-colors"
              aria-label="Прикрепить файл"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_FILE_TYPES.join(',')}
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />

            {/* Voice */}
            <VoiceRecordButton
              isRecording={isRecording}
              isTranscribing={isTranscribing}
              onClick={toggleRecording}
            />
          </div>

          {/* Send */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              'inline-flex items-center justify-center rounded-xl p-2.5 transition-all',
              canSend
                ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90'
                : 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)] cursor-not-allowed'
            )}
            aria-label="Отправить"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="text-center text-xs text-[var(--color-muted-foreground)] mt-2">
        GPTHub может допускать ошибки. Проверяй важную информацию.
      </p>
    </div>
  )
}
