import { create } from 'zustand'
import type { FileAttachment } from '@/types/file'

interface FileState {
  pendingFiles: FileAttachment[]
  addFile: (file: FileAttachment) => void
  removeFile: (id: string) => void
  updateFileStatus: (id: string, status: FileAttachment['status']) => void
  clearFiles: () => void
}

export const useFileStore = create<FileState>((set) => ({
  pendingFiles: [],

  addFile: (file) =>
    set((s) => ({ pendingFiles: [...s.pendingFiles, file] })),

  removeFile: (id) =>
    set((s) => ({ pendingFiles: s.pendingFiles.filter((f) => f.id !== id) })),

  updateFileStatus: (id, status) =>
    set((s) => ({
      pendingFiles: s.pendingFiles.map((f) =>
        f.id === id ? { ...f, status } : f
      ),
    })),

  clearFiles: () => set({ pendingFiles: [] }),
}))
