import { PrismaClient } from '@prisma/client'
import '../../backend/src/jsontypes'
import ExampleSurveyStepData from 'common/src/surveys/exampleSurveyStepData.json'
import { SurveyStep } from 'common/types/survey'

export async function seedTests(prisma: PrismaClient) {
  await prisma.user.create({
    data: {
      id: 99,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'password',
      role: 'participant',
    },
  })
  await prisma.participantProfile.create({
    data: {
      id: 1,
      addressLine: '123 smith st',
      dob: '1980-01-23',
      isParentOrGuardian: false,
      mobile: '0412345678',
      participantID: 'ABC123',
      postcode: '1234',
      preferredContact: 'EMAIL',
      state: 'VIC',
      suburb: 'M',
      userID: 99,
    },
  })
  await prisma.study.create({ data: { id: 1 } })
  await prisma.surveyVersion.create({
    data: {
      id: 1,
      versionNumber: 1,
      status: 'PUBLISHED',
      data: ExampleSurveyStepData as SurveyStep[],
    },
  })
  await prisma.surveyVersion.create({
    data: {
      id: 2,
      versionNumber: 2,
      status: 'DRAFT',
      data: ExampleSurveyStepData as SurveyStep[],
    },
  })
  await prisma.studyParticipant.create({ data: { id: 1, studyId: 1, profileId: 1, versionId: 1 } })
}
