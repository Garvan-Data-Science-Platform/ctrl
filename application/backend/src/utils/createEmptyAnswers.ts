import { SurveyStep, UserSurveyStepState } from 'common/types/survey'

export function createEmptyAnswers(surveySteps: SurveyStep[]): UserSurveyStepState[] {
  const result: UserSurveyStepState[] = []
  for (const step of surveySteps) {
    const stepAnswers = []
    for (const el of step.elements) {
      if (el.type == 'question-checkbox' || el.type == 'question-choices') {
        stepAnswers.push(undefined)
      }
    }
    result.push({ status: 'review_required', answers: stepAnswers })
  }
  return result
}
