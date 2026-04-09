import { useCallback } from 'react'
import { useFileStore } from '@/stores/fileStore'
import type { FileAttachment } from '@/types/file'
import { isImageFile, MAX_FILE_SIZE_MB, MAX_IMAGE_SIZE_MB } from '@/types/file'
import { generateId } from '@/lib/utils'

export function useFileUpload() {
  const { addFile, removeFile, pendingFiles } = useFileStore()

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files)
      for (const file of arr) {
        const maxMb = isImageFile(file.type) ? MAX_IMAGE_SIZE_MB : MAX_FILE_SIZE_MB
        if (file.size > maxMb * 1024 * 1024) {
          alert(`Файл "${file.name}" превышает ${maxMb}MB`)
          continue
        }

        let preview: string | undefined
        if (isImageFile(file.type)) {
          preview = await readAsDataURL(file)
        }

        const attachment: FileAttachment = {
          id: generateId(),
          name: file.name,
          size: file.size,
          type: file.type,
          preview,
          status: 'pending',
          blob: file,
        }
        addFile(attachment)
      }
    },
    [addFile]
  )

  return { addFiles, removeFile, pendingFiles }
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
