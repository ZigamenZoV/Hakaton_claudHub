import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MODELS, AUTO_MODEL_ID } from '@/lib/constants'
import type { Model } from '@/types/model'

interface ModelState {
  models: Model[]
  selectedModelId: string
  setSelectedModel: (id: string) => void
  getModelById: (id: string) => Model | undefined
}

export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      models: MODELS,
      selectedModelId: AUTO_MODEL_ID,

      setSelectedModel: (id) => set({ selectedModelId: id }),

      getModelById: (id) => get().models.find((m) => m.id === id),
    }),
    {
      name: 'gpthub-model',
      partialize: (state) => ({ selectedModelId: state.selectedModelId }),
    }
  )
)
