import { SurveyElement, SurveyStepAnswerArray } from 'common/types/survey'

export function extractSurveyStepAnswers(elements: SurveyElement[]): SurveyStepAnswerArray {
  const answers: SurveyStepAnswerArray = []
  for (const element of elements) {
    if (element.type === 'question-checkbox' || element.type === 'question-choices') {
      answers.push(element.data.value || false)
    }
  }
  return answers
}
