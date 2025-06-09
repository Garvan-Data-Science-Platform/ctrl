import { SurveyVersion } from '@prisma/client'
import { populateSurveyStepAnswers } from 'common/src/surveys/populateSurveyStepAnswers'
import {
  SurveyElement,
  SurveyStep,
  SurveyStepAnswerArray,
  UserSurveyStepState,
} from 'common/types/survey'
import prisma from '../PrismaClient'

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
  newSurveyVersion: SurveyVersion,
  previousAnswers: PrismaJson.SurveyAnswerData,
) {
  const result: UserSurveyStepState[] = []
  for (const step of newSurveyVersion.data) {
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

export function combineGuardianAnswers(answers_ls: SurveyStepAnswerArray[]): SurveyStepAnswerArray {
  for (const i in answers_ls) {
    if (answers_ls[i].length !== answers_ls[0].length) {
      throw Error('Guardian Answer Mismatch')
    }
  }
  //Iterate over each question
  return answers_ls[0].map((_, idx) => {
    //Create a set from each guardian's answer to that question
    const answer_set = new Set(answers_ls.map((a) => a[idx]))
    //If they all agree, use that answer
    if (answer_set.size == 1) {
      return answer_set.values().next().value as any
      //If they all agree, with some unanswered (null): use the non-null answer
    } else if (answer_set.size == 2 && answer_set.has(null)) {
      answer_set.delete(null)
      return answer_set.values().next().value as any
      //They disagree
    } else {
      return null
    }
  })
}

//Recalculates answers for all dependents in the family
// Does this need studyId as an input arg?
export async function recalculateAnswers(familyId: number, studyId: number) {
  const dependents = await prisma.participantProfile.findMany({
    where: {
      familyId: familyId,
      studies: {
        some: {
          studyId: studyId,
        },
      },
      participantType: {
        in: ['DEPENDENT_AGE', 'DEPENDENT_OTHER'],
      },
    },
  })
  if (!dependents) return

  const guardians = await prisma.participantProfile.findMany({
    where: {
      familyId: familyId,
      studies: {
        some: {
          studyId: studyId,
        },
      },
      participantType: 'GUARDIAN',
    },
  })

  if (guardians.length == 0) return

  let answers: PrismaJson.SurveyAnswerData

  const latestSurveyVersionAnswers = await prisma.surveyVersionAnswers.findFirstOrThrow({
    where: { profileId: guardians[0].id },
    orderBy: { versionId: 'desc' },
  })

  if (guardians.length == 1) {
    answers = latestSurveyVersionAnswers.answers
  } else {
    const promises = guardians.map(async (coGuardian) => {
      const coGuardianSP = await prisma.surveyVersionAnswers.findFirstOrThrow({
        where: { profileId: coGuardian.id, versionId: latestSurveyVersionAnswers.versionId },
      })
      return coGuardianSP.answers
    })
    const answers_ls = await Promise.all(promises)

    answers = structuredClone(answers_ls[0])
    for (const step in answers) {
      answers[step].answers = combineGuardianAnswers(answers_ls.map((val) => val[step].answers))
    }
  }

  for (const dep of dependents) {
    const sva = await prisma.surveyVersionAnswers.findFirstOrThrow({
      where: { profileId: dep.id, versionId: latestSurveyVersionAnswers.versionId },
    })
    await prisma.surveyVersionAnswers.update({
      where: { id: sva.id }, //
      data: {
        answers,
        derived: guardians.map((val) => `${val.firstName} ${val.lastName}`).join(', '),
      },
    })
  }
}
