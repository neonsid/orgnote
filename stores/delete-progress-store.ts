import { create } from 'zustand'

interface DeleteProgressState {
  progress: number
  fileName: string | null
  isActive: boolean
  setProgress: (progress: number) => void
  start: (fileName: string) => void
  complete: () => void
  reset: () => void
}

export const useDeleteProgressStore = create<DeleteProgressState>((set) => ({
  progress: 0,
  fileName: null,
  isActive: false,

  setProgress: (progress) => set({ progress }),
  start: (fileName) => set({ progress: 0, fileName, isActive: true }),
  complete: () => set({ progress: 100 }),
  reset: () =>
    set({ progress: 0, fileName: null, isActive: false }),
}))
