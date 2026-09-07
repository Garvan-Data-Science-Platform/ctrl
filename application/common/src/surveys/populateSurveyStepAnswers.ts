import { SurveyStep, SurveyStepAnswerArray } from 'common/types/survey'

export function populateSurveyStepAnswers(
  surveyStep: SurveyStep,
  answers: SurveyStepAnswerArray,
): SurveyStep {
  const populated = { ...surveyStep }
  let counter = 0
  for (const element of populated.elements) {
    if (element.type === 'question-choices') {
      element.data.value = answers[counter] as string | undefined
      counter++
    }
    if (element.type === 'question-checkbox') {
      element.data.value = answers[counter] as boolean | undefined
      counter++
    }
  }
  return populated
}
