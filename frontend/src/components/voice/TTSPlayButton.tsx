import { Volume2, Square, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { voiceService } from '@/services/voiceService'

interface Props {
  messageId: string
  text: string
}

export function TTSPlayButton({ messageId, text }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'playing'>('idle')
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  async function toggle() {
    if (state === 'playing') {
      audio?.pause()
      audio && (audio.currentTime = 0)
      setState('idle')
      return
    }

    setState('loading')
    let url: string | undefined
    try {
      const blob = await voiceService.synthesize(text)
      url = URL.createObjectURL(blob)
      const a = new Audio(url)
      a.onended = () => {
        setState('idle')
        URL.revokeObjectURL(url!)
      }
      setAudio(a)
      await a.play()
      setState('playing')
    } catch {
      if (url) URL.revokeObjectURL(url)
      setState('idle')
    }
  }

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center justify-center rounded p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-accent)] transition-colors"
      aria-label={state === 'playing' ? 'Остановить озвучку' : 'Озвучить'}
      title={`TTS #${messageId}`}
    >
      {state === 'loading' ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : state === 'playing' ? (
        <Square className="h-3.5 w-3.5" />
      ) : (
        <Volume2 className="h-3.5 w-3.5" />
      )}
    </button>
  )
}
