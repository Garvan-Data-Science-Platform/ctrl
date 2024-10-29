import type {
  SurveyElement,
  SurveyElementType,
  SurveyQuestionChoices,
  SurveyStep,
} from '@common/types/survey'
import { create } from 'zustand'
import survey from '@common/example_responses/getSurvey.json'
import { produce } from 'immer'

interface SurveyState {
  data: SurveyStep[]
  addStep: () => void
  addElement: (type: SurveyElementType, step: number) => void
  deleteElement: (step: number, index: number) => void
  moveElement: (step: number, index: number, destination: number) => void
  addChoice: (step: number, element: number) => void
  deleteChoice: (step: number, element: number, choice: number) => void
  updateStepField: (step: number, field: string, value: string) => void
}

type DefaultElementData = {
  [key in SurveyElementType]: SurveyElement['data']
}

const defaultElementData: DefaultElementData = {
  video: { link: '' },
  subheading: { text: '' },
  'question-checkbox': { text: '', value: true, required: true },
  'question-choices': { choices: [], required: true, text: '', value: '' },
}

export const useSurveyStore = create<SurveyState>((set) => ({
  data: survey.data as SurveyStep[],
  addStep: () =>
    set(
      produce((state) => {
        state.data.push({ title: 'New Step', text: '', elements: [] })
      }),
    ),
  addElement: (type: SurveyElementType, step: number) =>
    set(
      produce((state) => {
        state.data[step].elements.push({
          type,
          data: defaultElementData[type],
        })
      }),
    ),
  deleteElement: (step: number, index: number) =>
    set(
      produce((state) => {
        state.data[step].elements.splice(index, 1)
      }),
    ),
  moveElement: (step: number, index: number, destination: number) =>
    set(
      produce((state) => {
        if (destination < index - 1) {
          var a = state.data[step].elements[index]
          state.data[step].elements[index] = state.data[step].elements[destination + 1]
          state.data[step].elements[destination + 1] = a
        }
        if (destination > index) {
          var a = state.data[step].elements[index]
          state.data[step].elements[index] = state.data[step].elements[destination]
          state.data[step].elements[destination] = a
        }
      }),
    ),
  addChoice: (step: number, element: number) =>
    set(
      produce((state) => {
        state.data[step].elements[element].data.choices.push('')
      }),
    ),
  deleteChoice: (step: number, element: number, choice: number) => set((state) => state),
  updateStepField: (step: number, field: string, value: string) => {
    set(
      produce((state) => {
        state.data[step][field] = value
      }),
    )
  },
}))
