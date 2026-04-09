import { Mic, MicOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  isRecording: boolean
  isTranscribing: boolean
  onClick: () => void
}

export function VoiceRecordButton({ isRecording, isTranscribing, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isTranscribing}
      className={cn(
        'inline-flex items-center justify-center rounded-lg p-2 transition-all',
        isRecording
          ? 'bg-red-500 text-white animate-pulse hover:bg-red-600'
          : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]',
        isTranscribing && 'opacity-50 cursor-not-allowed'
      )}
      aria-label={isRecording ? 'Остановить запись' : 'Начать запись'}
    >
      {isTranscribing ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isRecording ? (
        <MicOff className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </button>
  )
}
