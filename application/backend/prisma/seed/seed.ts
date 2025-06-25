import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../../src/authentication'
import { SurveyStep } from '../../../common/types/survey'
import { createDefaultAnswers } from '../../src/utils/answers'

const prisma = new PrismaClient()

const main = async () => {
  await prisma.organisation.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'OrgName',
      mailerHost: process.env.MAILER_HOST,
      mailerPort: process.env.MAILER_PORT ? Number(process.env.MAILER_PORT) : null,
      mailerUser: process.env.MAILER_USER,
      mailerPassword: process.env.MAILER_PASSWORD,
      redcapURL: process.env.REDCAP_API_URL,
      redcapToken: process.env.REDCAP_API_TOKEN,
    },
  })

  // Ensure a Study record exists with id = 1
  const defaultStudy = await prisma.study.create({})

  console.log('Default Study created:', defaultStudy)

  const SeedSurveyStepData = require('./seedSurveyStepData.json')

  await prisma.surveyVersion.create({
    data: {
      status: 'PUBLISHED',
      data: SeedSurveyStepData as SurveyStep[],
    },
  })

  await prisma.surveyVersion.create({
    data: {
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
      password: 'SomePassword123',
    },
  })
  console.log('Added the following users:', john)

  const jane = await prisma.user.upsert({
    where: { email: 'janesmith@example.com' },
    update: {},
    create: {
      email: 'janesmith@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'OperatorAdmin',
      password: 'SomePassword123',
    },
  })
  console.log('Added the following users:', jane)

  const alice = await prisma.user.upsert({
    where: { email: 'alicejohnson@example.com' },
    update: {},
    create: {
      email: 'alicejohnson@example.com',
      firstName: 'Alice',
      middleName: 'Mary',
      lastName: 'Johnson',
      role: 'Participant',
      password: 'SomePassword123',
      organisations: {},
    },
  })
  console.log('Added the following users:', alice)

  const bob = await prisma.user.upsert({
    where: { email: 'bobbrown@example.com' },
    update: {},
    create: {
      email: 'bobbrown@example.com',
      firstName: 'Bob',
      lastName: 'Brown',
      role: 'OrganisationAdmin',
      password: 'SomePassword123',
    },
  })
  console.log('Added the following users:', bob)

  const emily = await prisma.user.upsert({
    where: { email: 'emilydavis@example.com' },
    update: {},
    create: {
      email: 'emilydavis@example.com',
      firstName: 'Emily',
      lastName: 'Davis',
      role: 'OperatorAdmin',
      password: 'SomePassword123',
    },
  })
  console.log('Added the following users:', emily)

  const michael = await prisma.user.upsert({
    where: { email: 'michaelwilson@example.com' },
    update: {},
    create: {
      email: 'michaelwilson@example.com',
      firstName: 'Michael',
      lastName: 'Wilson',
      role: 'Participant',
      password: 'SomePassword123',
      organisations: {},
    },
  })
  console.log('Added the following users:', michael)

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
      organisations: {},
      profiles: {
        create: [
          {
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
            surveys: {
              create: {
                versionId: 1,
                answers: createDefaultAnswers(SeedSurveyStepData),
              },
            },
          },
        ],
      },
    },
  })
  console.log('Added the following users:', exampleUser)
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
