import { create } from 'zustand'
import { produce } from 'immer'
import { Study } from '@prisma/client'

interface AppState {
  primaryColour: string | null
  secondaryColour: string | null
  contactMessageText: string
  updateContactMessageText: (newText: string) => void
  updateTheme: (primaryColor: string | null, secondaryColour: string | null) => void
  studies: Study[]
  activeStudyIndex: number
  setActiveStudyIndex: (index: number) => void
  setStudies: (studies: Study[]) => void
  reset: () => void
}

function standardize_color(str: string) {
  const ctx = document.createElement('canvas').getContext('2d') as any
  ctx.fillStyle = str
  return ctx.fillStyle
}

export const useAppStore = create<AppState>((set, get, store) => ({
  primaryColour: null,
  secondaryColour: null,
  contactMessageText: '',
  updateContactMessageText: (newText: string) => set({ contactMessageText: newText }),
  updateTheme: (primaryColour: string | null, secondaryColour: string | null) =>
    set({
      primaryColour: primaryColour && standardize_color(primaryColour),
      secondaryColour: secondaryColour && standardize_color(secondaryColour),
    }),
  studies: [],
  activeStudyIndex: Number(localStorage.getItem('activeStudyIndex') || 0),
  setActiveStudyIndex: (index: number) => {
    localStorage.setItem('activeStudyIndex', String(index))
    set(
      produce((state: any) => {
        state.activeStudyIndex = index
      }),
    )
  },
  setStudies: (studies: Study[]) =>
    set(
      produce((state) => {
        state.studies = studies
      }),
    ),
  reset: () => {
    set(store.getInitialState())
  },
}))

export const useCurrentStudyId = () => {
  const { activeStudyIndex, studies } = useAppStore()
  return studies[activeStudyIndex]?.id
}
