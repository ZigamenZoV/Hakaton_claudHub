import { useRef, useCallback } from 'react'
import { useVoiceStore } from '@/stores/voiceStore'
import { voiceService } from '@/services/voiceService'

export function useVoiceRecording(onTranscribed: (text: string) => void) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const { isRecording, isTranscribing, setRecording, setTranscribing } = useVoiceStore()

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setTranscribing(true)
        try {
          const text = await voiceService.transcribe(blob)
          onTranscribed(text)
        } catch (err) {
          console.error('Transcription error:', err)
        } finally {
          setTranscribing(false)
        }
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setRecording(true)
    } catch (err) {
      console.error('Microphone access error:', err)
      alert('Не удалось получить доступ к микрофону')
    }
  }, [setRecording, setTranscribing, onTranscribed])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    setRecording(false)
  }, [setRecording])

  const toggleRecording = useCallback(() => {
    if (isRecording) stopRecording()
    else startRecording()
  }, [isRecording, startRecording, stopRecording])

  return { isRecording, isTranscribing, toggleRecording }
}
