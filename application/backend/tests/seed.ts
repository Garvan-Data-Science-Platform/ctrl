import { PrismaClient } from '@prisma/client'
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
  await prisma.study.create({ data: { id: 1 } })

  //User in Test Organisation with no profile
  await prisma.user.create({
    data: {
      id: 97,
      email: 'test1@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'password',
      role: 'participant',
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
      role: 'participant',
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
      role: 'participant',
    },
  })
  await prisma.participantProfile.create({
    data: {
      id: 98,
      firstName: 'Test',
      lastName: 'User',
      addressLine: '123 smith st',
      dob: new Date('1980-01-23'),
      mobile: '0412345678',
      postcode: '1234',
      preferredContact: 'EMAIL',
      state: 'VIC',
      suburb: 'M',
      userId: 98,
      participantType: 'STANDARD',
    },
  })
  await prisma.participantProfile.create({
    data: {
      id: 99,
      firstName: 'Test',
      lastName: 'User',
      addressLine: '123 smith st',
      dob: new Date('1980-01-23'),
      mobile: '0412345678',
      postcode: '1234',
      preferredContact: 'EMAIL',
      state: 'VIC',
      suburb: 'Melbourne',
      userId: 99,
      participantType: 'STANDARD',
    },
  })

  await prisma.surveyVersion.create({
    data: {
      versionNumber: 1,
      status: 'PUBLISHED',
      data: ExampleSurveyStepData as SurveyStep[],
    },
  })
  await prisma.surveyVersion.create({
    data: {
      versionNumber: 2,
      status: 'DRAFT',
      data: ExampleSurveyStepData as SurveyStep[],
    },
  })
  await prisma.surveyParticipant.create({
    data: {
      versionId: 1,
      profileId: 98,
      answers: [
        { status: 'review_required', answers: [] },
        { status: 'review_required', answers: [true, 'Choice 1'] },
      ],
    },
  })
  await prisma.surveyParticipant.create({
    data: {
      versionId: 1,
      profileId: 99,
      answers: [
        { status: 'viewed', answers: [] },
        { status: 'completed', answers: [false, 'Choice 2'] },
      ],
    },
  })
}
