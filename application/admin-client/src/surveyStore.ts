import type { SurveyElement, SurveyElementType, SurveyStep } from '@common/types/survey'
import { create } from 'zustand'
import { produce } from 'immer'

interface SurveyState {
  data: SurveyStep[]
  setData: (data: SurveyStep[]) => void
  addStep: () => void
  addElement: (type: SurveyElementType, step: number) => void
  deleteElement: (step: number, index: number) => void
  moveElement: (step: number, index: number, destination: number) => void
  moveStep: (index: number, direction: 'up' | 'down') => void
  deleteStep: (index: number) => void
  addChoice: (step: number, element: number) => void
  deleteChoice: (step: number, element: number, choice: number) => void
  updateChoice: (step: number, element: number, choice: number, value: string) => void
  updateStepField: (step: number, field: keyof Omit<SurveyStep, 'elements'>, value: string) => void
  updateElementField: (step: number, element: number, field: string, value: any) => void
}

type DefaultElementData = {
  [key in SurveyElementType]: Extract<SurveyElement, { type: key }>['data']
}

const defaultElementData: DefaultElementData = {
  video: { link: '' },
  subheading: { text: '' },
  'question-checkbox': { text: '', value: false, required: false }, // I presume value should be false, used to be true
  'question-choices': { choices: [], text: '', value: '' },
}

export const useSurveyStore = create<SurveyState>((set) => ({
  data: [],
  setData: (data: SurveyStep[]) =>
    set(
      produce((state: SurveyState) => {
        state.data = data
      }),
    ),
  addStep: () =>
    set(
      produce((state: SurveyState) => {
        state.data.push({ title: 'New Step', text: '', elements: [] })
      }),
    ),
  addElement: (type: SurveyElementType, step: number) =>
    set(
      produce((state: SurveyState) => {
        state.data[step].elements.push({
          type,
          data: defaultElementData[type],
        } as SurveyElement)
      }),
    ),
  deleteElement: (step: number, index: number) =>
    set(
      produce((state: SurveyState) => {
        state.data[step].elements.splice(index, 1)
      }),
    ),
  deleteStep: (index: number) =>
    set(
      produce((state: SurveyState) => {
        state.data.splice(index, 1)
      }),
    ),
  moveElement: (step: number, index: number, destination: number) =>
    set(
      produce((state: SurveyState) => {
        // Updated to fix bug if moving more than one spot at a time
        const [movedElement] = state.data[step].elements.splice(index, 1)
        state.data[step].elements.splice(destination, 0, movedElement)
      }),
    ),
  moveStep: (index: number, direction: 'up' | 'down') =>
    set(
      produce((state: SurveyState) => {
        // Updated to prevent out of bounds
        const destination = direction === 'up' ? index - 1 : index + 1
        if (destination >= 0 && destination < state.data.length) {
          const [movedStep] = state.data.splice(index, 1)
          state.data.splice(destination, 0, movedStep)
        }
      }),
    ),
  addChoice: (step: number, element: number) =>
    set(
      produce((state: SurveyState) => {
        const el = state.data[step].elements[element]
        if (el.type === 'question-choices') {
          el.data.choices.push('')
        }
      }),
    ),
  deleteChoice: (step: number, element: number, choice: number) =>
    set(
      produce((state: SurveyState) => {
        const el = state.data[step].elements[element]
        if (el.type === 'question-choices') {
          el.data.choices.splice(choice, 1)
        }
      }),
    ),
  updateChoice: (step: number, element: number, choice: number, value: string) =>
    set(
      produce((state: SurveyState) => {
        const el = state.data[step].elements[element]
        if (el.type === 'question-choices') {
          el.data.choices[choice] = value
        }
      }),
    ),
  updateStepField: (step: number, field: keyof Omit<SurveyStep, 'elements'>, value: string) => {
    set(
      produce((state: SurveyState) => {
        state.data[step][field] = value
      }),
    )
  },
  updateElementField: (step: number, element: number, field: string, value: any) => {
    set(
      produce((state: SurveyState) => {
        const elData = state.data[step].elements[element].data as any
        elData[field] = value
      }),
    )
  },
}))
