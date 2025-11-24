import { InviteStatus, PrismaClient, Role } from '@prisma/client'
import '../../backend/src/jsontypes'
import { SurveyStep } from 'common/types/survey'
import { hashPassword } from '../../backend/src/authentication'

export const OPERATOR_ADMIN_ID = 96
export const ORG_ADMIN_ID = 97
export const ORG_ADMIN_2_ID = 101
export const PARTICIPANT_UNANSWERED_ID = 98
export const PARTICIPANT_UNANSWERED_EMAIL = 'test2@example.com'
export const PARTICIPANT_COMPLETED_ID = 99
export const PARTICIPANT_COMPLETED_EMAIL = 'test3@example.com'
export const DEPENDENT_ID = 100
export const SECOND_GUARDIAN_ID = 102
export const PASSWORD_RESET_USER_ID = 105
export const PASSWORD_RESET_USER_EMAIL = 'test-reset-password@example.com'
export const TEST_STUDY = 'Test Study'
export const TEST_STUDY_ID = 1
export const SECOND_TEST_STUDY = 'Study 2'
export const SECOND_TEST_STUDY_ID = 2
export const FE_TEST_STUDY = 'Study FE'
export const FE_TEST_STUDY_ID = 3
export const EMPTY_TEST_STUDY = 'Empty Study'

export async function seedTests(prisma: PrismaClient) {
  const ExampleSurveyStepData = await import('../src/surveys/exampleSurveyStepData.json', {
    assert: { type: 'json' },
  }).then((module) => module.default)
  await prisma.organisation.create({
    data: {
      id: 1,
      name: 'Test Organisation',
      primaryColour: 'red',
      secondaryColour: 'red',
      elsaToken: 'abc123',
      newsLink: 'https://ctrldynamicconsent.wordpress.com',
    },
  })

  //Sets auto-increment counter
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Organisation"', 'id'), 2, false) FROM "Organisation";`

  // Create four studies
  const testStudy = await prisma.study.create({
    data: {
      name: TEST_STUDY,
      id: TEST_STUDY_ID,
      redcapToken: 'ABC',
      redcapURL: 'http://redcaptest.com',
    },
  })

  // This study will have a survey, but no participant users and no draft answers (mostly for backend integration testing)
  // Used to test inviting user to new study (they are invited to this one)
  const secondTestStudy = await prisma.study.create({
    data: {
      name: SECOND_TEST_STUDY,
      id: SECOND_TEST_STUDY_ID,
    },
  })

  // This study will have a survey, a participant user and draft answers (mostly for frontend multistudy testing)
  const frontendTestStudy = await prisma.study.create({
    data: {
      name: FE_TEST_STUDY,
      id: FE_TEST_STUDY_ID,
    },
  })

  //Sets auto-increment counter
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Study"', 'id'), 4, false) FROM "Study";`

  // This study will be empty
  await prisma.study.create({
    data: {
      name: EMPTY_TEST_STUDY,
    },
  })

  // OperatorAdminUser
  await prisma.user.create({
    data: {
      id: OPERATOR_ADMIN_ID,
      email: 'operatoradmin@example.com',
      firstName: 'Operator',
      lastName: 'Admin',
      password: hashPassword('Testpassword1'),
      role: Role.OperatorAdmin,
    },
  })

  //OrganisationAdminUser
  await prisma.user.create({
    data: {
      id: ORG_ADMIN_ID,
      email: 'admin@example.com',
      firstName: 'Organisation',
      lastName: 'Admin',
      password: hashPassword('Testpassword1'),
      role: Role.OrganisationAdmin,
      organisations: {
        connect: {
          id: 1,
        },
      },
    },
  })

  //OrganisationAdminUser2
  await prisma.user.create({
    data: {
      id: ORG_ADMIN_2_ID,
      email: 'testOrgAdmin2@example.com',
      firstName: 'Organisation2',
      lastName: 'Admin2',
      password: hashPassword('Testpassword1'),
      role: Role.OrganisationAdmin,
      organisations: {
        connect: {
          id: 1,
        },
      },
    },
  })

  //User with unanswered survey
  await prisma.user.create({
    data: {
      id: PARTICIPANT_UNANSWERED_ID,
      email: PARTICIPANT_UNANSWERED_EMAIL,
      firstName: 'Test',
      lastName: 'User',
      password: hashPassword('Testpassword1'),
      role: Role.Participant,
      organisations: {
        connect: {
          id: 1,
        },
      },
    },
  })

  //Second guardian user
  await prisma.user.create({
    data: {
      id: SECOND_GUARDIAN_ID,
      email: 'g2@example.com',
      firstName: 'Second',
      lastName: 'Guardian',
      password: hashPassword('Testpassword1'),
      role: Role.Participant,
    },
  })
  //User with completed survey
  await prisma.user.create({
    data: {
      id: PARTICIPANT_COMPLETED_ID,
      email: PARTICIPANT_COMPLETED_EMAIL,
      firstName: 'Test',
      lastName: 'User',
      password: hashPassword('Testpassword1'),
      role: Role.Participant,
    },
  })

  const participantUnansweredProfile = await prisma.participantProfile.create({
    data: {
      id: PARTICIPANT_UNANSWERED_ID,
      firstName: 'Unanswered',
      lastName: 'User',
      addressLine: '123 smith st',
      dob: '1980-01-24',
      mobile: '0412345678',
      postcode: '1234',
      preferredContact: 'EMAIL',
      state: 'VIC',
      suburb: 'M',
      studies: {
        create: {
          participantId: `PID-TEST1-${PARTICIPANT_UNANSWERED_ID}`,
          study: {
            connect: {
              id: testStudy.id,
            },
          },
        },
      },
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
      firstName: 'Completed',
      lastName: 'User',
      addressLine: '123 smith st',
      dob: '1980-01-23',
      mobile: '0412345678',
      postcode: '1234',
      preferredContact: 'EMAIL',
      state: 'VIC',
      suburb: 'Melbourne',
      studies: {
        create: {
          participantId: `PID-TEST1-${PARTICIPANT_COMPLETED_ID}`,
          study: {
            connect: {
              id: testStudy.id,
            },
          },
        },
      },
      userId: PARTICIPANT_COMPLETED_ID,
      familyId: 100,
      participantType: 'GUARDIAN',
    },
  })

  //Dependent Profile (no user)
  await prisma.participantProfile.create({
    data: {
      id: DEPENDENT_ID,
      firstName: 'Test',
      lastName: 'Dependent',
      addressLine: '123 smith st',
      dob: '1990-01-23',
      mobile: '0412345678',
      postcode: '1234',
      preferredContact: 'EMAIL',
      state: 'VIC',
      suburb: 'Melbourne',
      studies: {
        create: {
          participantId: `PID-TEST1-${DEPENDENT_ID}`,
          study: {
            connect: {
              id: testStudy.id,
            },
          },
        },
      },
      familyId: 100,
      userId: null,
      participantType: 'DEPENDENT_AGE',
    },
  })

  //Second guardian
  await prisma.participantProfile.create({
    data: {
      id: SECOND_GUARDIAN_ID,
      firstName: 'Second',
      lastName: 'Guardian',
      addressLine: '123 smith st',
      dob: '1990-01-23',
      mobile: '0412345678',
      postcode: '1234',
      preferredContact: 'EMAIL',
      state: 'VIC',
      suburb: 'Melbourne',
      studies: {
        create: {
          participantId: `PID-TEST1-${SECOND_GUARDIAN_ID}`,
          study: {
            connect: {
              id: testStudy.id,
            },
          },
        },
      },
      familyId: 100,
      userId: SECOND_GUARDIAN_ID,
      participantType: 'GUARDIAN',
    },
  })

  await prisma.surveyVersion.create({
    data: {
      status: 'PUBLISHED',
      versionNumber: 1,
      data: ExampleSurveyStepData as SurveyStep[],
      studyId: testStudy.id,
    },
  })

  await prisma.surveyVersion.create({
    data: {
      status: 'DRAFT',
      versionNumber: 2,
      data: ExampleSurveyStepData as SurveyStep[],
      studyId: testStudy.id,
    },
  })
  // publish a survey for study 2
  const study2survey = await prisma.surveyVersion.create({
    data: {
      status: 'PUBLISHED',
      versionNumber: 1,
      data: [
        {
          title: 'Study2step',
          text: '',
          elements: [
            {
              type: 'question-checkbox',
              data: {
                text: 'Hello',
                value: null,
              },
            },
          ],
        },
      ] as SurveyStep[],
      studyId: secondTestStudy.id,
    },
  })

  await prisma.surveyVersionAnswers.create({
    data: {
      versionId: 1,
      profileId: PARTICIPANT_UNANSWERED_ID,
      answers: [
        { status: 'review_required', answers: [] },
        { status: 'review_required', answers: [null, null] },
      ],
    },
  })
  await prisma.surveyVersionAnswers.create({
    data: {
      versionId: study2survey.id,
      profileId: PARTICIPANT_UNANSWERED_ID,
      answers: [{ status: 'review_required', answers: [null] }],
    },
  })
  await prisma.surveyVersionAnswers.create({
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

  await prisma.surveyVersionAnswers.create({
    data: {
      versionId: 1,
      profileId: DEPENDENT_ID,
      answers: [
        { status: 'viewed', answers: [] },
        {
          status: 'review_required',
          answers: [null, null],
          last_updated: '2024-12-02T23:45:27.815Z',
        },
      ],
    },
  })

  await prisma.surveyVersionAnswers.create({
    data: {
      versionId: 1,
      profileId: SECOND_GUARDIAN_ID,
      answers: [
        { status: 'viewed', answers: [] },
        {
          status: 'review_required',
          answers: [null, null],
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

  // Setup invites
  await prisma.invite.createMany({
    data: [
      {
        email: 'invite1@pending.com',
        status: InviteStatus.PENDING,
        studyId: testStudy.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day in the future
      },
      {
        email: 'invite2@accepted.com',
        status: InviteStatus.ACCEPTED,
        studyId: testStudy.id,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day in the past
      },
      {
        email: 'invite3@revoked.com',
        status: InviteStatus.REVOKED,
        studyId: testStudy.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day in the future
      },
      {
        email: 'invite4@expired.com',
        status: InviteStatus.EXPIRED,
        studyId: testStudy.id,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day in the past
      },
      // Pending invites for testing
      {
        email: 'john@example.com',
        status: InviteStatus.PENDING,
        studyId: testStudy.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day in the future
      },
      {
        email: 'jenny@gmail.com',
        status: InviteStatus.PENDING,
        studyId: testStudy.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day in the future
      },
      {
        email: 'abcsdfwefijsdf@gjiodsf.com',
        status: InviteStatus.PENDING,
        studyId: testStudy.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day in the future
      },
    ],
  })

  // Frontend multistudy test seed data
  const frontendTestSurveryVersion = await prisma.surveyVersion.create({
    data: {
      status: 'PUBLISHED',
      versionNumber: 1,
      data: [
        {
          title: 'Frontend study step',
          text: '',
          elements: [
            {
              type: 'question-checkbox',
              data: {
                text: 'Hello',
                duoCodes: [{ code: 'DUO:0000004', relatedAnswer: true }],
              },
            },
          ],
        },
      ] as SurveyStep[],
      studyId: frontendTestStudy.id,
    },
  })

  await prisma.participantProfile.update({
    where: {
      id: participantUnansweredProfile.id,
    },
    data: {
      studies: {
        create: {
          participantId: `PID-TEST2-${PARTICIPANT_UNANSWERED_ID}`,
          study: {
            connect: {
              id: frontendTestStudy.id,
            },
          },
        },
      },
    },
  })

  await prisma.surveyVersionAnswers.create({
    data: {
      versionId: frontendTestSurveryVersion.id,
      profileId: PARTICIPANT_UNANSWERED_ID,
      answers: [{ status: 'review_required', answers: [null] }],
    },
  })
}
