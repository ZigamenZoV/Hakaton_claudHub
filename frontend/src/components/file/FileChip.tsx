import { X, FileText, FileSpreadsheet, File } from 'lucide-react'
import type { FileAttachment } from '@/types/file'
import { formatFileSize } from '@/lib/utils'

function FileIcon({ type }: { type: string }) {
  if (type.includes('pdf') || type.includes('word')) return <FileText className="h-3.5 w-3.5" />
  if (type.includes('spreadsheet') || type.includes('csv') || type.includes('excel'))
    return <FileSpreadsheet className="h-3.5 w-3.5" />
  return <File className="h-3.5 w-3.5" />
}

interface Props {
  file: FileAttachment
  onRemove: (id: string) => void
}

export function FileChip({ file, onRemove }: Props) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2 py-1.5 text-xs max-w-[180px]">
      <FileIcon type={file.type} />
      <div className="min-w-0">
        <div className="truncate font-medium text-[var(--color-foreground)]">{file.name}</div>
        <div className="text-[var(--color-muted-foreground)]">{formatFileSize(file.size)}</div>
      </div>
      <button
        onClick={() => onRemove(file.id)}
        className="shrink-0 ml-0.5 rounded p-0.5 hover:bg-[var(--color-destructive)]/20 hover:text-[var(--color-destructive)] text-[var(--color-muted-foreground)] transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}
