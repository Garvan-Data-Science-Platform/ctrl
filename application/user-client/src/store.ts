import { create } from 'zustand'

interface AppState {
  contactMessageText: string
  updateContactMessageText: (newText: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  contactMessageText: '',
  updateContactMessageText: (newText: string) => set({ contactMessageText: newText }),
}))
