import { SurveyStep, SurveyStepAnswerArray } from 'common/types/survey'

export function populateSurveyStepAnswers(
  surveyStep: SurveyStep,
  answers: SurveyStepAnswerArray,
): SurveyStep {
  const populated = { ...surveyStep }
  let counter = 0
  for (const element of populated.elements) {
    if (['question-checkbox', 'question-choices'].includes(element.type)) {
      element.data.value = answers[counter]
      counter++
    }
  }
  return populated
}
