import { create } from 'zustand'

interface AppState {
  contactMessageText: string
  updateContactMessageText: (newText: string) => void
  bears: number
  increasePopulation: (by: number) => void
  removeAllBears: () => void
}

export const useAppStore = create<AppState>((set) => ({
  contactMessageText: '',
  updateContactMessageText: (newText: string) => set({ contactMessageText: newText }),
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}))
