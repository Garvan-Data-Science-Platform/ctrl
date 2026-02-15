import { create } from 'zustand'
import { produce } from 'immer'

export interface StudyEntry {
  id: number
  name: string
  description?: string
  logo?: SourceBuffer
  redcapURL?: string
  redcapToken?: string
}

interface StudyState {
  studies: StudyEntry[]
  activeStudyIndex: number
  setActiveStudyIndex: (index: number) => void
  setStudies: (studies: StudyEntry[]) => void
}

export const useStudyStore = create<StudyState>((set) => ({
  studies: [],
  activeStudyIndex: Number(localStorage.getItem('activeStudyIndex') || 0),
  setActiveStudyIndex: (index: number) =>
    set(
      produce((state) => {
        state.activeStudyIndex = index
      }),
    ),
  setStudies: (studies: StudyEntry[]) =>
    set(
      produce((state) => {
        state.studies = studies
        state.activeStudyIndex = Math.max(0, Math.min(studies.length - 1, state.activeStudyIndex))
      }),
    ),
}))

export const useCurrentStudyId = () => {
  const { activeStudyIndex, studies } = useStudyStore()
  return studies && studies[activeStudyIndex].id
}
