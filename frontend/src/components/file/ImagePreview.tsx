import { X } from 'lucide-react'
import type { FileAttachment } from '@/types/file'

interface Props {
  file: FileAttachment
  onRemove: (id: string) => void
}

export function ImagePreview({ file, onRemove }: Props) {
  return (
    <div className="relative group h-16 w-16 shrink-0 rounded-lg overflow-hidden border border-[var(--color-border)]">
      {file.preview ? (
        <img src={file.preview} alt={file.name} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full bg-[var(--color-muted)] flex items-center justify-center text-xs text-[var(--color-muted-foreground)]">
          IMG
        </div>
      )}
      <button
        onClick={() => onRemove(file.id)}
        className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-3 w-3 text-white" />
      </button>
    </div>
  )
}
