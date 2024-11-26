import { generateToken } from '../authentication'
import { Api } from '../Api'
import { resetDB } from '../../tests/TestHelpers'

const api = new Api()

describe('ParticipantsController', () => {
  let registeredUserToken: string, registeredParticipantToken: string
  const registeredUserId: number = 97
  const registeredParticipantUserId: number = 99
  beforeAll(async () => {
    registeredUserToken = await generateToken({
      userId: registeredUserId,
      roles: ['OrganisationAdmin'],
    })

    registeredParticipantToken = await generateToken({
      userId: registeredParticipantUserId,
      roles: ['Participant'],
    })

    api.run()
  })

  beforeEach(async () => {
    await resetDB()
  })

  afterAll(async () => {
    api.stop()
  })

  describe('GET /participants', () => {
    it('Test', async () => {
      console.log(registeredUserToken)
      console.log(registeredParticipantToken)
    })
  })
})
