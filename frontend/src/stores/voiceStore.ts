import { create } from 'zustand'

interface VoiceState {
  isRecording: boolean
  isTranscribing: boolean
  isSpeaking: boolean
  speakingMessageId: string | null
  setRecording: (v: boolean) => void
  setTranscribing: (v: boolean) => void
  setSpeaking: (v: boolean, messageId?: string | null) => void
}

export const useVoiceStore = create<VoiceState>((set) => ({
  isRecording: false,
  isTranscribing: false,
  isSpeaking: false,
  speakingMessageId: null,

  setRecording: (v) => set({ isRecording: v }),
  setTranscribing: (v) => set({ isTranscribing: v }),
  setSpeaking: (v, messageId = null) =>
    set({ isSpeaking: v, speakingMessageId: messageId }),
}))
