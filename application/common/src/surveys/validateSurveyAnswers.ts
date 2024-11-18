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
    switch (element.type) {
      case 'question-checkbox':
        if (!['boolean', 'undefined'].includes(typeof answers[counter])) {
          return false
        } else {
          counter += 1
        }
        break

      case 'question-choices':
        if (!element.data.choices.includes(answers[counter])) {
          return false
        } else {
          counter += 1
        }
        break

      default:
        break
    }
  }
  return true
}
