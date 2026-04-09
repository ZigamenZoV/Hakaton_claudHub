const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
import { ApiError } from './api'

export const voiceService = {
  async transcribe(audioBlob: Blob): Promise<string> {
    const form = new FormData()
    form.append('audio', audioBlob, 'recording.webm')
    const res = await fetch(`${BASE_URL}/voice/transcribe`, {
      method: 'POST',
      body: form,
    })
    if (!res.ok) throw new ApiError(res.status, await res.text())
    const data = await res.json() as { text: string }
    return data.text
  },

  async synthesize(text: string): Promise<Blob> {
    const res = await fetch(`${BASE_URL}/voice/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) throw new ApiError(res.status, await res.text())
    return res.blob()
  },
}
