export type FileStatus = 'pending' | 'uploading' | 'uploaded' | 'error'

export interface FileAttachment {
  id: string
  name: string
  size: number
  type: string
  preview?: string
  status: FileStatus
  /** Actual File object — available only before send, not persisted */
  blob?: File
}

export const ACCEPTED_FILE_TYPES = [
  '.pdf', '.docx', '.txt', '.xlsx', '.csv',
  '.png', '.jpg', '.jpeg', '.gif', '.webp',
  '.mp3', '.wav', '.ogg', '.webm', '.m4a',
]

export const MAX_FILE_SIZE_MB = 10
export const MAX_IMAGE_SIZE_MB = 5

export function isImageFile(type: string): boolean {
  return type.startsWith('image/')
}

export function isAudioFile(type: string): boolean {
  return type.startsWith('audio/')
}
