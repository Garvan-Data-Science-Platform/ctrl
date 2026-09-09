import { SurveyStep, SurveyStepAnswerArray } from 'common/types/survey'

export function validateAnswers(surveyStep: SurveyStep, answers: SurveyStepAnswerArray): boolean {
  let counter = 0

  if (
    answers.length !==
    surveyStep.elements.filter((val) =>
      ['question-checkbox', 'question-choices'].includes(val.type),
    ).length
  ) {
    return false
  }

  for (const element of surveyStep.elements) {
    const answer = answers[counter]

    switch (element.type) {
      case 'question-checkbox':
        if (typeof answer !== 'boolean' && answer !== null) {
          return false
        } else {
          counter += 1
        }
        break

      case 'question-choices':
        if (answer !== null) {
          if (typeof answer !== 'string' || !element.data.choices.includes(answer)) {
            return false
          }
        }
        counter += 1
        break

      default:
        break
    }
  }
  return true
}
