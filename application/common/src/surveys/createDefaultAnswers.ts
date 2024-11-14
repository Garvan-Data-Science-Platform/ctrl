import { SurveyStep, UserSurveyStepState } from 'common/types/survey'

export function createDefaultAnswers(surveySteps: SurveyStep[]): UserSurveyStepState[] {
  const result: UserSurveyStepState[] = []
  for (const step of surveySteps) {
    const stepAnswers = []
    for (const el of step.elements) {
      if (el.type == 'question-checkbox' || el.type == 'question-choices') {
        stepAnswers.push(el.data.value)
      }
    }
    result.push({ status: 'review_required', answers: stepAnswers })
  }
  return result
}
