import { InviteStatus, PrismaClient, Role } from '@prisma/client'
import '../../backend/src/jsontypes'
import { SurveyStep } from 'common/types/survey'
import { hashPassword } from '../../backend/src/authentication'
import { TestUsers, TestStudies, TestInvites } from './constants'

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
  // Test Study - nested ACCEPTED invites for the three participants below (UNANSWERED, COMPLETED, GUARDIAN_2), plus fixture invites in various states for testing invite lifecycle
  const testStudy = await prisma.study.create({
    data: {
      name: TestStudies.TEST_STUDY.name,
      id: TestStudies.TEST_STUDY.id,
      redcapToken: 'ABC',
      redcapURL: 'http://redcaptest.com',
      contactUsEmail: 'test@contactus.com',
      invites: {
        create: [
          {
            email: TestUsers.PARTICIPANT_UNANSWERED.email,
            status: InviteStatus.ACCEPTED,
            expiresAt: new Date('2026-01-01'),
            sentAt: new Date('2025-12-15'),
          },
          {
            email: TestUsers.PARTICIPANT_COMPLETED.email,
            status: InviteStatus.ACCEPTED,
            expiresAt: new Date('2026-01-01'),
            sentAt: new Date('2025-12-15'),
          },
          {
            email: TestUsers.GUARDIAN_2.email,
            status: InviteStatus.ACCEPTED,
            expiresAt: new Date('2026-01-01'),
            sentAt: new Date('2025-12-15'),
          },
          {
            email: TestInvites.INVITE_PENDING.email,
            status: InviteStatus.PENDING,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day in the future
          },
          {
            email: TestInvites.INVITE_ACCEPTED.email,
            status: InviteStatus.ACCEPTED,
            expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day in the past
          },
          {
            email: TestInvites.INVITE_REVOKED.email,
            status: InviteStatus.REVOKED,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day in the future
          },
          {
            email: TestInvites.INVITE_EXPIRED.email,
            status: InviteStatus.EXPIRED,
            expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day in the past
          },
          {
            email: TestInvites.INVITE_2_PENDING.email,
            status: InviteStatus.PENDING,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day in the future
          },
        ],
      },
    },
  })

  // This study will have a survey, but no participant users and no draft answers (mostly for backend integration testing)
  // Used to test inviting user to new study (they are invited to this one)
  const secondTestStudy = await prisma.study.create({
    data: {
      name: TestStudies.TEST_STUDY_2.name,
      id: TestStudies.TEST_STUDY_2.id,
    },
  })

  // This study will have a survey, a participant user and draft answers (mostly for frontend multistudy testing)
  // Nested ACCEPTED invites for GUARDIAN_2 and PARTICIPANT_UNANSWERED (both linked to this study below)
  const frontendTestStudy = await prisma.study.create({
    data: {
      name: TestStudies.FE_TEST_STUDY.name,
      id: TestStudies.FE_TEST_STUDY.id,
      invites: {
        create: [
          {
            email: TestUsers.GUARDIAN_2.email,
            status: InviteStatus.ACCEPTED,
            expiresAt: new Date('2026-01-01'),
            sentAt: new Date('2025-12-15'),
          },
          {
            email: TestUsers.PARTICIPANT_UNANSWERED.email,
            status: InviteStatus.ACCEPTED,
            expiresAt: new Date('2026-01-01'),
            sentAt: new Date('2025-12-15'),
          },
        ],
      },
    },
  })

  //Sets auto-increment counter
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Study"', 'id'), 4, false) FROM "Study";`

  // This study will be empty
  await prisma.study.create({
    data: {
      name: TestStudies.EMPTY_TEST_STUDY.name,
    },
  })

  // OperatorAdminUser
  await prisma.user.create({
    data: {
      id: TestUsers.OPERATOR_ADMIN.id,
      email: TestUsers.OPERATOR_ADMIN.email,
      firstName: 'Operator',
      lastName: 'Admin',
      password: hashPassword(TestUsers.OPERATOR_ADMIN.password),
      role: Role.OperatorAdmin,
    },
  })

  //OrganisationAdminUser
  await prisma.user.create({
    data: {
      id: TestUsers.ORG_ADMIN.id,
      email: TestUsers.ORG_ADMIN.email,
      firstName: 'Organisation',
      lastName: 'Admin',
      password: hashPassword(TestUsers.ORG_ADMIN.password),
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
      id: TestUsers.ORG_ADMIN_2.id,
      email: TestUsers.ORG_ADMIN_2.email,
      firstName: 'Organisation2',
      lastName: 'Admin2',
      password: hashPassword(TestUsers.ORG_ADMIN_2.password),
      role: Role.OrganisationAdmin,
      organisations: {
        connect: {
          id: 1,
        },
      },
    },
  })

  //StudyAdminUser
  await prisma.user.create({
    data: {
      id: TestUsers.STUDY_ADMIN.id,
      email: TestUsers.STUDY_ADMIN.email,
      firstName: 'Study',
      lastName: 'Admin',
      password: hashPassword(TestUsers.STUDY_ADMIN.password),
      role: Role.StudyAdmin,
      organisations: {
        connect: {
          id: 1,
        },
      },
      adminOfStudies: {
        connect: {
          id: 1,
        },
      },
    },
  })

  // Survey versions - created before participants so they can be nested inside profile creation
  const testSurveyVersion = await prisma.surveyVersion.create({
    data: {
      id: 800,
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

  // Published survey for study 2
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

  // User with unanswered survey - nested writes for user + profile + study + nextOfKin + surveys
  await prisma.user.upsert({
    where: { email: TestUsers.PARTICIPANT_UNANSWERED.email },
    update: {},
    create: {
      id: TestUsers.PARTICIPANT_UNANSWERED.id,
      email: TestUsers.PARTICIPANT_UNANSWERED.email,
      firstName: 'Test',
      lastName: 'User',
      password: hashPassword(TestUsers.PARTICIPANT_UNANSWERED.password),
      role: Role.Participant,
      organisations: { connect: { id: 1 } },
      profiles: {
        create: [
          {
            id: TestUsers.PARTICIPANT_UNANSWERED.id,
            firstName: 'Unanswered',
            lastName: 'User',
            addressLine: '123 smith st',
            dob: '1980-01-24',
            mobile: '0412345678',
            postcode: '1234',
            preferredContact: 'EMAIL',
            state: 'VIC',
            suburb: 'M',
            participantType: 'STANDARD',
            studies: {
              create: {
                participantId: `PID-TEST1-${TestUsers.PARTICIPANT_UNANSWERED.id}`,
                study: { connect: { id: testStudy.id } },
              },
            },
            nextOfKin: {
              create: {
                email: 'alt@email.com',
                firstName: 'Alt',
                lastName: 'Cont',
              },
            },
            surveys: {
              create: [
                {
                  versionId: testSurveyVersion.id,
                  answers: [
                    { status: 'review_required', answers: [] },
                    { status: 'review_required', answers: [null, null] },
                  ],
                },
                {
                  versionId: study2survey.id,
                  answers: [{ status: 'review_required', answers: [null] }],
                },
              ],
            },
          },
        ],
      },
    },
  })
  // User with completed survey
  await prisma.user.upsert({
    where: { email: TestUsers.PARTICIPANT_COMPLETED.email },
    update: {},
    create: {
      id: TestUsers.PARTICIPANT_COMPLETED.id,
      email: TestUsers.PARTICIPANT_COMPLETED.email,
      firstName: 'Test',
      lastName: 'User',
      password: hashPassword(TestUsers.PARTICIPANT_COMPLETED.password),
      role: Role.Participant,
      profiles: {
        create: [
          {
            id: TestUsers.PARTICIPANT_COMPLETED.id,
            firstName: 'Completed',
            lastName: 'User',
            addressLine: '123 smith st',
            dob: '1980-01-23',
            mobile: '0412345678',
            postcode: '1234',
            preferredContact: 'EMAIL',
            state: 'VIC',
            suburb: 'Melbourne',
            familyId: 100,
            participantType: 'GUARDIAN',
            studies: {
              create: {
                participantId: `PID-TEST1-${TestUsers.PARTICIPANT_COMPLETED.id}`,
                study: { connect: { id: testStudy.id } },
              },
            },
            surveys: {
              create: {
                versionId: testSurveyVersion.id,
                answers: [
                  { status: 'viewed', answers: [] },
                  {
                    status: 'completed',
                    answers: [false, 'Choice 2'],
                    last_updated: '2024-12-02T23:45:27.815Z',
                  },
                ],
              },
            },
          },
        ],
      },
    },
  })
  // Dependent Profile (no user - so profile.create with nested studies + surveys)
  await prisma.participantProfile.create({
    data: {
      id: TestUsers.DEPENDENT.id,
      firstName: 'Test',
      lastName: 'Dependent',
      addressLine: '123 smith st',
      dob: '1990-01-23',
      mobile: '0412345678',
      postcode: '1234',
      preferredContact: 'EMAIL',
      state: 'VIC',
      suburb: 'Melbourne',
      familyId: 100,
      userId: null,
      participantType: 'DEPENDENT_AGE',
      studies: {
        create: {
          participantId: `PID-TEST1-${TestUsers.DEPENDENT.id}`,
          study: { connect: { id: testStudy.id } },
        },
      },
      surveys: {
        create: {
          versionId: testSurveyVersion.id,
          answers: [
            { status: 'viewed', answers: [] },
            {
              status: 'review_required',
              answers: [null, null],
              last_updated: '2024-12-02T23:45:27.815Z',
            },
          ],
        },
      },
    },
  })

  // Second guardian user
  await prisma.user.upsert({
    where: { email: TestUsers.GUARDIAN_2.email },
    update: {},
    create: {
      id: TestUsers.GUARDIAN_2.id,
      email: TestUsers.GUARDIAN_2.email,
      firstName: 'Second',
      lastName: 'Guardian',
      password: hashPassword(TestUsers.GUARDIAN_2.password),
      role: Role.Participant,
      profiles: {
        create: [
          {
            id: TestUsers.GUARDIAN_2.id,
            firstName: 'Second',
            lastName: 'Guardian',
            addressLine: '123 smith st',
            dob: '1990-01-23',
            mobile: '0412345678',
            postcode: '1234',
            preferredContact: 'EMAIL',
            state: 'VIC',
            suburb: 'Melbourne',
            familyId: 100,
            participantType: 'GUARDIAN',
            studies: {
              create: {
                participantId: `PID-TEST1-${TestUsers.GUARDIAN_2.id}`,
                study: { connect: { id: testStudy.id } },
              },
            },
            surveys: {
              create: {
                versionId: testSurveyVersion.id,
                answers: [
                  { status: 'viewed', answers: [] },
                  {
                    status: 'review_required',
                    answers: [null, null],
                    last_updated: '2024-12-02T23:45:27.815Z',
                  },
                ],
              },
            },
          },
        ],
      },
    },
  })
  // Seed a user and password reset token
  await prisma.user.create({
    data: {
      id: TestUsers.PASSWORD_RESET_USER.id,
      email: TestUsers.PASSWORD_RESET_USER.email,
      firstName: 'Test',
      lastName: 'User',
      password: hashPassword(TestUsers.PASSWORD_RESET_USER.password),
      role: Role.Participant,
    },
  })

  await prisma.passwordResetToken.create({
    data: {
      token: 'valid-reset-token',
      userId: TestUsers.PASSWORD_RESET_USER.id,
      expiresAt: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes in the future
      used: false,
    },
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
      id: TestUsers.GUARDIAN_2.id,
    },
    data: {
      studies: {
        create: {
          participantId: `PID-TEST2-${TestUsers.GUARDIAN_2.id}`,
          study: {
            connect: {
              id: frontendTestStudy.id,
            },
          },
        },
      },
    },
  })

  await prisma.participantProfile.update({
    where: {
      id: TestUsers.PARTICIPANT_UNANSWERED.id,
    },
    data: {
      studies: {
        create: {
          participantId: `PID-TEST2-${TestUsers.PARTICIPANT_UNANSWERED.id}`,
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
      profileId: TestUsers.PARTICIPANT_UNANSWERED.id,
      answers: [{ status: 'review_required', answers: [null] }],
    },
  })
  await prisma.surveyVersionAnswers.create({
    data: {
      versionId: frontendTestSurveryVersion.id,
      profileId: TestUsers.GUARDIAN_2.id,
      answers: [{ status: 'review_required', answers: [null] }],
    },
  })
}
