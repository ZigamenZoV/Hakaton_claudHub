import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  webSearchEnabled: boolean
  researchModeEnabled: boolean
  presentationModeEnabled: boolean

  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleWebSearch: () => void
  toggleResearchMode: () => void
  togglePresentationMode: () => void
  setWebSearch: (v: boolean) => void
  setResearchMode: (v: boolean) => void
  setPresentationMode: (v: boolean) => void
  clearModes: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  webSearchEnabled: false,
  researchModeEnabled: false,
  presentationModeEnabled: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  toggleWebSearch: () =>
    set((s) => ({
      webSearchEnabled: !s.webSearchEnabled,
      researchModeEnabled: false,
      presentationModeEnabled: false,
    })),
  toggleResearchMode: () =>
    set((s) => ({
      researchModeEnabled: !s.researchModeEnabled,
      webSearchEnabled: false,
      presentationModeEnabled: false,
    })),
  togglePresentationMode: () =>
    set((s) => ({
      presentationModeEnabled: !s.presentationModeEnabled,
      webSearchEnabled: false,
      researchModeEnabled: false,
    })),

  setWebSearch: (v) => set({ webSearchEnabled: v, researchModeEnabled: false, presentationModeEnabled: false }),
  setResearchMode: (v) => set({ researchModeEnabled: v, webSearchEnabled: false, presentationModeEnabled: false }),
  setPresentationMode: (v) => set({ presentationModeEnabled: v, webSearchEnabled: false, researchModeEnabled: false }),
  clearModes: () => set({ webSearchEnabled: false, researchModeEnabled: false, presentationModeEnabled: false }),
}))
