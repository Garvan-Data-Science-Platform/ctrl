import { PrismaClient, Role } from '@prisma/client'
import '../../backend/src/jsontypes'
import ExampleSurveyStepData from 'common/src/surveys/exampleSurveyStepData.json'
import { SurveyStep } from 'common/types/survey'

export async function seedTests(prisma: PrismaClient) {
  await prisma.organisation.create({
    data: {
      id: 99,
      name: 'Test Organisation',
    },
  })

  //User in Test Organisation with no profile
  await prisma.user.create({
    data: {
      id: 97,
      email: 'test1@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'password',
      role: Role.Participant,
      organisations: {
        connect: {
          id: 99,
        },
      },
    },
  })
  //User with unanswered survey
  await prisma.user.create({
    data: {
      id: 98,
      email: 'test2@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'password',
      role: Role.Participant,
      organisations: {
        create: {
          name: 'Another Organisation',
        },
      },
    },
  })
  //User with completed survey
  await prisma.user.create({
    data: {
      id: 99,
      email: 'test3@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'password',
      role: Role.Participant,
    },
  })
  await prisma.participantProfile.create({
    data: {
      id: 99,
      addressLine: '123 smith st',
      dob: new Date('1980-01-23'),
      isParentOrGuardian: false,
      mobile: '0412345678',
      participantID: 'ABC123',
      postcode: '1234',
      preferredContact: 'EMAIL',
      state: 'VIC',
      suburb: 'M',
      userId: 98,
    },
  })
  await prisma.participantProfile.create({
    data: {
      id: 100,
      addressLine: '123 smith st',
      dob: new Date('1980-01-23'),
      isParentOrGuardian: false,
      mobile: '0412345678',
      participantID: 'ABC123',
      postcode: '1234',
      preferredContact: 'EMAIL',
      state: 'VIC',
      suburb: 'Melbourne',
      userId: 99,
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
  await prisma.surveyParticipant.create({ data: { id: 1, versionId: 1, userId: 98 } })
  await prisma.surveyParticipant.create({ data: { id: 2, versionId: 1, userId: 99 } })
  await prisma.surveyAnswers.create({
    data: {
      participantId: 2,
      id: 1,
      data: [
        { status: 'viewed', answers: [] },
        { status: 'completed', answers: [false, 'Choice 2'] },
      ],
    },
  })
  await prisma.surveyAnswers.create({
    data: {
      participantId: 1,
      id: 2,
      data: [
        { status: 'review_required', answers: [] },
        { status: 'review_required', answers: [true, 'Choice 1'] },
      ],
    },
  })
}
