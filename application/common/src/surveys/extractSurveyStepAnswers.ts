import { SurveyElement, SurveyStepAnswerArray } from 'common/types/survey'

export function extractSurveyStepAnswers(elements: SurveyElement[]): SurveyStepAnswerArray {
  const answers: SurveyStepAnswerArray = []
  for (const element of elements) {
    if (['question-checkbox', 'question-choices'].includes(element.type)) {
      answers.push(element.data.value)
    }
  }
  return answers
}
