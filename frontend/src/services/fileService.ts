const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
import { ApiError } from './api'

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
}

export const fileService = {
  async uploadFile(file: File): Promise<UploadedFile> {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`${BASE_URL}/files/upload`, {
      method: 'POST',
      body: form,
    })
    if (!res.ok) throw new ApiError(res.status, await res.text())
    return res.json() as Promise<UploadedFile>
  },
}
