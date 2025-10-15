import { ParticipantProfile, StudyParticipant, SurveyVersionAnswers } from '@prisma/client'
import { createDefaultAnswers } from '../src/utils/answers'
import prisma from '../src/PrismaClient'
import { faker } from '@faker-js/faker'

const main = async () => {
  // Get number of records from command line argument, fallback to 1000
  const numRecords = process.argv[2] ? parseInt(process.argv[2], 10) : 1000
  if (isNaN(numRecords) || numRecords <= 0) {
    console.error('Please provide a valid positive integer for the number of records.')
    process.exit(1)
  }

  //eslint-disable-next-line
  const SeedSurveyStepData = require('../prisma/seed/seedSurveyStepData.json')
  const exampleAnswers = createDefaultAnswers(SeedSurveyStepData)

  const participants: Partial<StudyParticipant>[] = []
  const profiles: Partial<ParticipantProfile>[] = []
  const answers: Partial<SurveyVersionAnswers>[] = []
  for (let i = 0; i < numRecords; i++) {
    const pData: Partial<ParticipantProfile> = {
      id: 1000 + i,
      addressLine: faker.string.alphanumeric(),
      dob: faker.date.birthdate(),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      mobile: faker.phone.number(),
      participantType: 'STANDARD',
      postcode: '1234',
      preferredContact: 'EMAIL',
      state: 'ACT',
      suburb: 'SUBURB',
    }
    profiles.push(pData)
    participants.push({
      participantId: faker.string.uuid(),
      participantProfileId: 1000 + i,
      studyId: 1,
      participantNumber: 1000 + i,
    })

    answers.push({ profileId: 1000 + i, versionId: 1000, answers: exampleAnswers })
  }
  await prisma.participantProfile.createMany({ data: profiles as any })
  await prisma.studyParticipant.createMany({ data: participants as any })
  await prisma.surveyVersionAnswers.createMany({ data: answers as any })
}

main()
