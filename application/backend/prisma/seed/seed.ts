import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../../src/authentication'
import { SurveyStep } from '../../../common/types/survey'
import { createDefaultAnswers, recalculateAnswers } from '../../src/utils/answers'
import prisma from '../../src/PrismaClient'

const main = async () => {
  await prisma.organisation.upsert({
    where: { name: 'OrgName' },
    update: {},
    create: {
      name: 'OrgName',
      mailerHost: process.env.MAILER_HOST,
      mailerPort: process.env.MAILER_PORT ? Number(process.env.MAILER_PORT) : null,
      mailerUser: process.env.MAILER_USER,
      mailerPassword: process.env.MAILER_PASSWORD,
      redcapURL: process.env.REDCAP_API_URL,
      redcapToken: process.env.REDCAP_API_TOKEN,
      elsaToken: 'ctrl-elsa-abc123',
    },
  })

  const ShortSurveyStepData = require('./shortSurveyData.json')
  const shortStudy = await prisma.study.create({
    data: {
      name: 'Short Study',
    },
  })
  console.log('Short Study created:', shortStudy)

  await prisma.surveyVersion.create({
    data: {
      id: 900,
      versionNumber: 1,
      studyId: shortStudy.id,
      status: 'PUBLISHED',
      data: ShortSurveyStepData as SurveyStep[],
    },
  })

  await prisma.surveyVersion.create({
    data: {
      id: 901,
      versionNumber: 2,
      studyId: shortStudy.id,
      status: 'DRAFT',
      data: ShortSurveyStepData as SurveyStep[],
    },
  })

  const baseAnswers = createDefaultAnswers(ShortSurveyStepData)

  const michael = await prisma.user.upsert({
    where: { email: 'michaelwilson@example.com' },
    update: {},
    create: {
      email: 'michaelwilson@example.com',
      firstName: 'Michael',
      lastName: 'Wilson',
      role: 'Participant',
      password: hashPassword('SomePassword123'),
      profiles: {
        create: [
          {
            individualId: 'IND-ABC-001',
            firstName: 'Michael',
            middleName: 'Arundell',
            lastName: 'Wilson',
            dob: new Date('1915-05-31'),
            mobile: '0412345678',
            addressLine: '123 Main St',
            suburb: 'Armidale',
            state: 'NSW',
            postcode: '2000',
            participantType: 'GUARDIAN',
            preferredContact: 'EMAIL',
            familyId: 100,
            nextOfKin: {
              create: {
                firstName: 'Jack',
                lastName: 'McKinney',
                email: 'jackmckinney@example.com',
                mobile: '0412345679',
              },
            },
            studies: {
              create: {
                studyId: shortStudy.id,
                participantId: 'PID-XAY-00000',
              },
            },
            surveys: {
              create: {
                versionId: 900,
                answers: baseAnswers,
              },
            },
          },
        ],
      },
    },
  })

  await prisma.user.upsert({
    where: { email: 'sallywilson@example.com' },
    update: {},
    create: {
      email: 'sallywilson@example.com',
      firstName: 'Sally',
      lastName: 'Wilson',
      role: 'Participant',
      password: hashPassword('SomePassword123'),
      profiles: {
        create: [
          {
            individualId: 'IND-ABC-002',
            firstName: 'Sally',
            middleName: 'Arundell',
            lastName: 'Wilson',
            dob: new Date('1915-05-31'),
            mobile: '0412345678',
            addressLine: '123 Main St',
            suburb: 'Armidale',
            state: 'NSW',
            postcode: '2000',
            participantType: 'GUARDIAN',
            preferredContact: 'EMAIL',
            familyId: 100,
            nextOfKin: {
              create: {
                firstName: 'Jack',
                lastName: 'McKinney',
                email: 'jackmckinney@example.com',
                mobile: '0412345679',
              },
            },
            studies: {
              create: {
                studyId: shortStudy.id,
                participantId: 'PID-XAY-00001',
              },
            },
            surveys: {
              create: {
                versionId: 900,
                answers: baseAnswers,
              },
            },
          },
        ],
      },
    },
  })

  await prisma.participantProfile.upsert({
    where: {
      individualId: 'IND-ABC-003',
    },
    update: {},
    create: {
      individualId: 'IND-ABC-003',
      firstName: 'Johnny',
      middleName: 'Arundell',
      lastName: 'Wilson',
      dob: new Date('2025-05-31'),
      mobile: '0412345678',
      addressLine: '123 Main St',
      suburb: 'Armidale',
      state: 'NSW',
      postcode: '2000',
      participantType: 'DEPENDENT_AGE',
      preferredContact: 'EMAIL',
      familyId: 100,
      nextOfKin: {
        create: {
          firstName: 'Jack',
          lastName: 'McKinney',
          email: 'jackmckinney@example.com',
          mobile: '0412345679',
        },
      },
      studies: {
        create: {
          studyId: shortStudy.id,
          participantId: 'PID-XAY-00002',
        },
      },
      surveys: {
        create: {
          versionId: 900,
          answers: baseAnswers,
        },
      },
    },
  })

  const alice = await prisma.user.upsert({
    where: { email: 'alicejohnson@example.com' },
    update: {},
    create: {
      email: 'alicejohnson@example.com',
      firstName: 'Alice',
      middleName: 'Mary',
      lastName: 'Johnson',
      role: 'Participant',
      password: hashPassword('SomePassword123'),
      organisations: {},
      profiles: {
        create: [
          {
            individualId: 'IND-ABC-004',
            firstName: 'Alice',
            middleName: 'Arundell',
            lastName: 'Johnson',
            dob: new Date('1915-05-31'),
            mobile: '0412345678',
            addressLine: '123 Main St',
            suburb: 'Armidale',
            state: 'NSW',
            postcode: '2000',
            participantType: 'STANDARD',
            preferredContact: 'EMAIL',
            familyId: 2,
            nextOfKin: {
              create: {
                firstName: 'Jack',
                lastName: 'McKinney',
                email: 'jackmckinney@example.com',
                mobile: '0412345679',
              },
            },
            studies: {
              create: {
                studyId: shortStudy.id,
                participantId: 'PID-XAY-00003',
              },
            },
            surveys: {
              create: {
                versionId: 900,
                answers: baseAnswers,
              },
            },
          },
        ],
      },
    },
  })

  // Ensure a Study record exists
  const defaultStudy = await prisma.study.create({
    data: {
      name: 'Seed Study',
    },
  })

  console.log('Default Study created:', defaultStudy)

  const SeedSurveyStepData = require('./seedSurveyStepData.json')

  await prisma.surveyVersion.create({
    data: {
      id: 1000,
      versionNumber: 1,
      studyId: defaultStudy.id,
      status: 'PUBLISHED',
      data: SeedSurveyStepData as SurveyStep[],
    },
  })

  await prisma.surveyVersion.create({
    data: {
      id: 2000,
      versionNumber: 2,
      studyId: defaultStudy.id,
      status: 'DRAFT',
      data: SeedSurveyStepData as SurveyStep[],
    },
  })

  const john = await prisma.user.upsert({
    where: { email: 'johndoe@example.com' },
    update: {},
    create: {
      email: 'johndoe@example.com',
      firstName: 'John',
      middleName: 'James',
      lastName: 'Doe',
      role: 'OrganisationAdmin',
      password: hashPassword('SomePassword123'),
    },
  })

  const jane = await prisma.user.upsert({
    where: { email: 'janesmith@example.com' },
    update: {},
    create: {
      email: 'janesmith@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'OperatorAdmin',
      password: hashPassword('SomePassword123'),
    },
  })

  const bob = await prisma.user.upsert({
    where: { email: 'bobbrown@example.com' },
    update: {},
    create: {
      email: 'bobbrown@example.com',
      firstName: 'Bob',
      lastName: 'Brown',
      role: 'OrganisationAdmin',
      password: hashPassword('SomePassword123'),
    },
  })

  const emily = await prisma.user.upsert({
    where: { email: 'emilydavis@example.com' },
    update: {},
    create: {
      email: 'emilydavis@example.com',
      firstName: 'Emily',
      lastName: 'Davis',
      role: 'OperatorAdmin',
      password: hashPassword('SomePassword123'),
    },
  })

  const exampleAdmin = await prisma.user.upsert({
    where: { email: String(process.env.EXAMPLE_ADMIN_EMAIL) },
    update: {},
    create: {
      email: String(process.env.EXAMPLE_ADMIN_EMAIL),
      firstName: 'Example',
      lastName: 'Admin',
      role: 'OrganisationAdmin',
      password: hashPassword(String(process.env.EXAMPLE_ADMIN_PASSWORD)),
    },
  })
  console.log('Added the following users:', exampleAdmin)

  const exampleAnswers = createDefaultAnswers(SeedSurveyStepData)
  exampleAnswers[1].answers[0] = false //For DUO testing
  const exampleUser = await prisma.user.upsert({
    where: { email: String(process.env.EXAMPLE_PARTICIPANT_EMAIL) },
    update: {},
    create: {
      email: String(process.env.EXAMPLE_PARTICIPANT_EMAIL),
      firstName: 'Judith',
      middleName: 'Arundell',
      lastName: 'Wright',
      role: 'Participant',
      password: hashPassword(String(process.env.EXAMPLE_PARTICIPANT_PASSWORD)),
      profiles: {
        create: [
          {
            individualId: 'IND-ABC-123',
            firstName: 'Judith',
            middleName: 'Arundell',
            lastName: 'Wright',
            dob: new Date('1915-05-31'),
            mobile: '0412345678',
            addressLine: '123 Main St',
            suburb: 'Armidale',
            state: 'NSW',
            postcode: '2000',
            participantType: 'STANDARD',
            preferredContact: 'EMAIL',
            nextOfKin: {
              create: {
                firstName: 'Jack',
                lastName: 'McKinney',
                email: 'jackmckinney@example.com',
                mobile: '0412345679',
              },
            },
            studies: {
              createMany: {
                data: [
                  {
                    studyId: defaultStudy.id,
                    participantId: 'PID-TYT-00000',
                  },
                  {
                    studyId: shortStudy.id,
                    participantId: 'PID-XAY-00004',
                  },
                ],
              },
            },
            surveys: {
              createMany: {
                data: [
                  {
                    versionId: 1000,
                    answers: exampleAnswers,
                  },
                  {
                    versionId: 900,
                    answers: baseAnswers,
                  },
                ],
              },
            },
          },
        ],
      },
    },
  })
  console.log('Added the following users:', exampleUser)

  const judithShortAnswers = await prisma.surveyVersionAnswers.findFirstOrThrow({
    where: { versionId: 900, profile: { userId: exampleUser.id } },
  })
  const michaelShortAnswers = await prisma.surveyVersionAnswers.findFirstOrThrow({
    where: { versionId: 900, profile: { userId: michael.id } },
  })
  const aliceShortAnswers = await prisma.surveyVersionAnswers.findFirstOrThrow({
    where: { versionId: 900, profile: { userId: alice.id } },
  })

  const ans = baseAnswers
  ans[1].last_updated = new Date().toISOString()
  ans[1].status = 'completed'
  ans[1].answers = [true, true, 'Musculoskeletal diseases only', true]
  await prisma.surveyVersionAnswers.update({
    where: { id: judithShortAnswers.id },
    data: { answers: ans },
  })
  ans[1].answers = [true, false, 'Musculoskeletal diseases only', false]
  ans[0].status = 'completed'
  await prisma.surveyVersionAnswers.update({
    where: { id: michaelShortAnswers.id },
    data: { answers: ans },
  })
  await recalculateAnswers(100, 1)
  ans[1].answers = [true, true, 'Any biomedical research', false]
  await prisma.surveyVersionAnswers.update({
    where: { id: aliceShortAnswers.id },
    data: { answers: ans },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
