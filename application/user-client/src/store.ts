import { create } from 'zustand'

interface AppState {
  primaryColour: string | null
  secondaryColour: string | null
  contactMessageText: string
  updateContactMessageText: (newText: string) => void
  updateTheme: (primaryColor: string | null, secondaryColour: string | null) => void
}

function standardize_color(str: string) {
  var ctx = document.createElement('canvas').getContext('2d') as any
  ctx.fillStyle = str
  return ctx.fillStyle
}

export const useAppStore = create<AppState>((set) => ({
  primaryColour: null,
  secondaryColour: null,
  contactMessageText: '',
  updateContactMessageText: (newText: string) => set({ contactMessageText: newText }),
  updateTheme: (primaryColour: string | null, secondaryColour: string | null) =>
    set({
      primaryColour: primaryColour && standardize_color(primaryColour),
      secondaryColour: secondaryColour && standardize_color(secondaryColour),
    }),
}))
