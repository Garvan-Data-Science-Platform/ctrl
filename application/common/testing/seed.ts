import { InviteStatus, PrismaClient, Role } from '@prisma/client'
import '../../backend/src/jsontypes'
import { SurveyStep } from 'common/types/survey'
import { hashPassword } from '../../backend/src/authentication'

export const OPERATOR_ADMIN_ID = 96
export const ORG_ADMIN_ID = 97
export const PARTICIPANT_UNANSWERED_ID = 98
export const PARTICIPANT_COMPLETED_ID = 99
export const PASSWORD_RESET_USER_ID = 105
export const PASSWORD_RESET_USER_EMAIL = 'test-reset-password@example.com'

export async function seedTests(prisma: PrismaClient) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ExampleSurveyStepData = require('../src/surveys/exampleSurveyStepData.json')
  await prisma.organisation.create({
    data: {
      id: 99,
      name: 'Test Organisation',
    },
  })
  await prisma.study.create({ data: { id: 1 } })

  // OperatorAdminUser
  await prisma.user.create({
    data: {
      id: OPERATOR_ADMIN_ID,
      email: 'operatoradmin@example.com',
      firstName: 'Operator',
      lastName: 'Admin',
      password: hashPassword('password'),
      role: Role.OperatorAdmin,
    },
  })

  //OrganisationAdminUser
  await prisma.user.create({
    data: {
      id: ORG_ADMIN_ID,
      email: 'test1@example.com',
      firstName: 'Organisation',
      lastName: 'Admin',
      password: hashPassword('password'),
      role: Role.OrganisationAdmin,
      organisations: {
        connect: {
          id: 99,
        },
      },
    },
  })

  //OrganisationAdminUser
  await prisma.user.create({
    data: {
      id: 101,
      email: 'testOrgAdmin2@example.com',
      firstName: 'Organisation2',
      lastName: 'Admin2',
      password: hashPassword('password'),
      role: Role.OrganisationAdmin,
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
      id: PARTICIPANT_UNANSWERED_ID,
      email: 'test2@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: hashPassword('password'),
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
      id: PARTICIPANT_COMPLETED_ID,
      email: 'test3@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: hashPassword('password'),
      role: Role.Participant,
    },
  })
  await prisma.participantProfile.create({
    data: {
      id: PARTICIPANT_UNANSWERED_ID,
      firstName: 'Test',
      lastName: 'User',
      addressLine: '123 smith st',
      dob: new Date('1980-01-23'),
      mobile: '0412345678',
      postcode: '1234',
      preferredContact: 'EMAIL',
      state: 'VIC',
      suburb: 'M',
      userId: PARTICIPANT_UNANSWERED_ID,
      participantType: 'STANDARD',
    },
  })

  await prisma.alternativeContact.create({
    data: {
      participantProfileId: PARTICIPANT_UNANSWERED_ID,
      email: 'alt@email.com',
      firstName: 'Alt',
      lastName: 'Cont',
    },
  })

  await prisma.participantProfile.create({
    data: {
      id: PARTICIPANT_COMPLETED_ID,
      firstName: 'Test',
      lastName: 'User',
      addressLine: '123 smith st',
      dob: new Date('1980-01-23'),
      mobile: '0412345678',
      postcode: '1234',
      preferredContact: 'EMAIL',
      state: 'VIC',
      suburb: 'Melbourne',
      userId: PARTICIPANT_COMPLETED_ID,
      familyId: 100,
      participantType: 'GUARDIAN',
    },
  })

  //Dependent Profile (no user)
  await prisma.participantProfile.create({
    data: {
      id: 100,
      firstName: 'Test',
      lastName: 'Dependent',
      addressLine: '123 smith st',
      dob: new Date('1990-01-23'),
      mobile: '0412345678',
      postcode: '1234',
      preferredContact: 'EMAIL',
      state: 'VIC',
      suburb: 'Melbourne',
      familyId: 100,
      userId: null,
      participantType: 'DEPENDENT_AGE',
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
      profileId: PARTICIPANT_UNANSWERED_ID,
      answers: [
        { status: 'review_required', answers: [] },
        { status: 'review_required', answers: [true, 'Choice 1'] },
      ],
    },
  })
  await prisma.surveyParticipant.create({
    data: {
      versionId: 1,
      profileId: PARTICIPANT_COMPLETED_ID,
      answers: [
        { status: 'viewed', answers: [] },
        {
          status: 'completed',
          answers: [false, 'Choice 2'],
          last_updated: '2024-12-02T23:45:27.815Z',
        },
      ],
    },
  })

  await prisma.surveyParticipant.create({
    data: {
      versionId: 1,
      profileId: 100,
      answers: [
        { status: 'viewed', answers: [] },
        {
          status: 'completed',
          answers: [false, 'Choice 2'],
          last_updated: '2024-12-02T23:45:27.815Z',
        },
      ],
    },
  })

  // Seed a user and password reset token
  await prisma.user.create({
    data: {
      id: PASSWORD_RESET_USER_ID,
      email: PASSWORD_RESET_USER_EMAIL,
      firstName: 'Test',
      lastName: 'User',
      password: await hashPassword('OldPassword123'),
      role: Role.Participant,
    },
  })

  await prisma.passwordResetToken.create({
    data: {
      token: 'valid-reset-token',
      userId: PASSWORD_RESET_USER_ID,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes in the future
      used: false,
    },
  })

  // Setup 4 invites
  // Setup 4 invites
  await prisma.invite.createMany({
    data: [
      {
        email: 'invite1@pending.com',
        status: InviteStatus.PENDING,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day in the future
      },
      {
        email: 'invite2@accepted.com',
        status: InviteStatus.ACCEPTED,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day in the past
      },
      {
        email: 'invite3@revoked.com',
        status: InviteStatus.REVOKED,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day in the future
      },
      {
        email: 'invite4@expired.com',
        status: InviteStatus.EXPIRED,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day in the past
      },
    ],
  })
}
