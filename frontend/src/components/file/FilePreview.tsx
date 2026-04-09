import type { FileAttachment } from '@/types/file'
import { isImageFile } from '@/types/file'
import { FileChip } from './FileChip'
import { ImagePreview } from './ImagePreview'

interface Props {
  files: FileAttachment[]
  onRemove: (id: string) => void
}

export function FilePreview({ files, onRemove }: Props) {
  if (files.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 px-3 pt-2 pb-0">
      {files.map((f) =>
        isImageFile(f.type) ? (
          <ImagePreview key={f.id} file={f} onRemove={onRemove} />
        ) : (
          <FileChip key={f.id} file={f} onRemove={onRemove} />
        )
      )}
    </div>
  )
}
