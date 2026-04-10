import { useRef, useState, useCallback, type KeyboardEvent } from 'react'
import { Send, Paperclip, Globe, FlaskConical, Presentation } from 'lucide-react'
import { useAutoResize } from '@/hooks/useAutoResize'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useVoiceRecording } from '@/hooks/useVoiceRecording'
import { FilePreview } from '@/components/file/FilePreview'
import { VoiceRecordButton } from '@/components/voice/VoiceRecordButton'
import { cn } from '@/lib/utils'
import { ACCEPTED_FILE_TYPES } from '@/types/file'
import { useUIStore } from '@/stores/uiStore'

interface Props {
  onSend: (text: string) => void
  isStreaming: boolean
}

export function ChatInput({ onSend, isStreaming }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const webSearch = useUIStore((s) => s.webSearchEnabled)
  const researchMode = useUIStore((s) => s.researchModeEnabled)
  const presentationMode = useUIStore((s) => s.presentationModeEnabled)
  const toggleWebSearch = useUIStore((s) => s.toggleWebSearch)
  const toggleResearchMode = useUIStore((s) => s.toggleResearchMode)
  const togglePresentationMode = useUIStore((s) => s.togglePresentationMode)

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

  const canSend = value.trim().length > 0 && !isStreaming

  return (
    <div
      className="px-4 pb-4 pt-2 max-w-3xl mx-auto w-full"
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
    >
      {/* Active mode indicators */}
      {(webSearch || researchMode || presentationMode) && (
        <div className="flex items-center gap-2 mb-2 px-1">
          {webSearch && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-purple)]/15 border border-[var(--color-purple)]/25 px-3 py-1 text-xs font-medium text-[var(--color-purple)]">
              <Globe className="h-3 w-3" />
              Поиск в интернете
            </span>
          )}
          {researchMode && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-3 py-1 text-xs font-medium text-emerald-400">
              <FlaskConical className="h-3 w-3" />
              Deep Research
            </span>
          )}
          {presentationMode && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/25 px-3 py-1 text-xs font-medium text-amber-400">
              <Presentation className="h-3 w-3" />
              Генерация презентации
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          'relative rounded-2xl border transition-all glass',
          isDragging
            ? 'border-[var(--color-primary)]/50 ring-2 ring-[var(--color-primary)]/20'
            : isRecording
              ? 'border-[var(--color-primary)]/60 ring-2 ring-[var(--color-primary)]/15'
              : 'border-white/10 hover:border-[var(--color-purple)]/30 focus-within:border-[var(--color-purple)]/50 focus-within:ring-2 focus-within:ring-[var(--color-purple)]/10'
        )}
      >
        {isDragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 pointer-events-none">
            <p className="text-sm font-medium text-[var(--color-primary)]">Перетащи файлы сюда</p>
          </div>
        )}

        <FilePreview files={pendingFiles} onRemove={removeFile} />

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isRecording
              ? 'Запись...'
              : presentationMode
                ? 'Опиши тему презентации...'
                : researchMode
                  ? 'Задай вопрос для глубокого исследования...'
                  : webSearch
                    ? 'Поиск в интернете...'
                    : 'Напиши сообщение... (Enter — отправить)'
          }
          rows={1}
          disabled={isRecording || isTranscribing}
          className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-base outline-none placeholder:text-[var(--color-muted-foreground)] text-[var(--color-foreground)] min-h-[60px] max-h-[200px] disabled:opacity-60 leading-relaxed"
        />

        {/* Actions row */}
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-0.5">
            {/* Attach file */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center rounded-lg p-2 text-[var(--color-muted-foreground)] hover:bg-[var(--color-purple)]/15 hover:text-[var(--color-purple)] transition-colors"
              aria-label="Прикрепить файл"
              title="Прикрепить файл (PDF, изображение, аудио...)"
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

            {/* Divider */}
            <div className="w-px h-5 bg-[var(--color-border)]/50 mx-1" />

            {/* Web search toggle */}
            <button
              type="button"
              onClick={toggleWebSearch}
              className={cn(
                'inline-flex items-center justify-center rounded-lg p-2 transition-colors',
                webSearch
                  ? 'bg-[var(--color-purple)]/20 text-[var(--color-purple)]'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-purple)]/10 hover:text-[var(--color-purple)]'
              )}
              aria-label="Поиск в интернете"
              title="Поиск в интернете"
            >
              <Globe className="h-5 w-5" />
            </button>

            {/* Research mode toggle */}
            <button
              type="button"
              onClick={toggleResearchMode}
              className={cn(
                'inline-flex items-center justify-center rounded-lg p-2 transition-colors',
                researchMode
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-[var(--color-muted-foreground)] hover:bg-emerald-500/10 hover:text-emerald-400'
              )}
              aria-label="Deep Research"
              title="Deep Research — глубокий анализ"
            >
              <FlaskConical className="h-5 w-5" />
            </button>

            {/* Presentation mode toggle */}
            <button
              type="button"
              onClick={togglePresentationMode}
              className={cn(
                'inline-flex items-center justify-center rounded-lg p-2 transition-colors',
                presentationMode
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-[var(--color-muted-foreground)] hover:bg-amber-500/10 hover:text-amber-400'
              )}
              aria-label="Презентация"
              title="Генерация презентации"
            >
              <Presentation className="h-5 w-5" />
            </button>
          </div>

          {/* Send */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
              canSend
                ? 'bg-gradient-to-br from-[var(--color-primary)] to-[#ff5030] text-white hover:opacity-90 shadow-md shadow-[var(--color-primary)]/30'
                : 'bg-white/5 text-[var(--color-muted-foreground)] cursor-not-allowed'
            )}
            aria-label="Отправить"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Отправить</span>
          </button>
        </div>
      </div>
      <p className="text-center text-xs text-[var(--color-muted-foreground)]/50 mt-2">
        GPTHub · MWS GPT Alpha · Может допускать ошибки
      </p>
    </div>
  )
}
