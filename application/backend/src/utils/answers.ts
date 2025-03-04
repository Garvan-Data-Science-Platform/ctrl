import { SurveyVersion } from '@prisma/client'
import { populateSurveyStepAnswers } from 'common/src/surveys/populateSurveyStepAnswers'
import {
  SurveyElement,
  SurveyStep,
  SurveyStepAnswerArray,
  UserSurveyStepState,
} from 'common/types/survey'

export function determineLastUpdated(answers: PrismaJson.SurveyAnswerData) {
  let latest_date = new Date('1900-01-01')

  for (const answerStep of answers) {
    const ans_date = new Date(answerStep.last_updated || '1900-01-01')
    if (ans_date > latest_date) {
      latest_date = ans_date
    }
  }
  if (latest_date.toISOString() == new Date('1900-01-01').toISOString()) return null
  return latest_date
}

export function determineStatus(answers: PrismaJson.SurveyAnswerData, date_published: Date) {
  if (answers.every((val) => ['completed', 'viewed'].includes(val.status))) return 'complete'

  const last_updated = determineLastUpdated(answers) || new Date('1900-01-01')

  if (last_updated > date_published) return 'partially_complete'

  return 'incomplete'
}

export function createDefaultAnswers(surveySteps: SurveyStep[]): UserSurveyStepState[] {
  const result: UserSurveyStepState[] = []
  for (const step of surveySteps) {
    const stepAnswers = []
    for (const el of step.elements) {
      if (el.type == 'question-checkbox' || el.type == 'question-choices') {
        stepAnswers.push(null)
      }
    }
    result.push({ status: 'review_required', answers: stepAnswers })
  }
  return result
}

function getPreviousAnswer(
  previousSteps: SurveyStep[],
  currentQuestionElement: SurveyElement,
  previousAnswers: PrismaJson.SurveyAnswerData,
): string | boolean | null {
  let answer = null
  for (const i in previousSteps) {
    const populated = populateSurveyStepAnswers(previousSteps[i], previousAnswers[i].answers)
    for (const el of populated.elements) {
      if (el.data.text == currentQuestionElement.data.text) {
        if (el.type == 'question-choices') {
          if (
            JSON.stringify(el.data.choices) === JSON.stringify(currentQuestionElement.data.choices)
          )
            answer = el.data.value
        } else {
          answer = el.data.value
        }
      }
    }
  }
  return answer
}

export function answersFromPreviousSurvey(
  previousSurveyVersion: SurveyVersion,
  currentSurveyVersion: SurveyVersion,
  previousAnswers: PrismaJson.SurveyAnswerData,
) {
  const result: UserSurveyStepState[] = []
  for (const step of currentSurveyVersion.data) {
    const stepAnswers = []
    for (const el of step.elements) {
      if (el.type == 'question-checkbox' || el.type == 'question-choices') {
        const prevAns = getPreviousAnswer(previousSurveyVersion.data, el, previousAnswers)
        stepAnswers.push(prevAns)
      }
    }
    result.push({ status: 'review_required', answers: stepAnswers })
  }
  return result
}

export function combineGuardianAnswers(
  answers1: SurveyStepAnswerArray,
  answers2: SurveyStepAnswerArray,
): SurveyStepAnswerArray {
  if (answers1.length != answers2.length) {
    throw Error('Guardian Answer Mismatch')
  }
  return answers1.map((val, idx) => {
    if (val == answers2[idx]) {
      return val
    } else if (val === null) {
      return answers2[idx]
    } else if (answers2[idx] === null) {
      return val
    } else {
      return null
    }
  })
}
