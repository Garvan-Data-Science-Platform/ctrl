import request from 'supertest'
import { RegisterParticipantRequest, RegisterParticipantResponse } from 'common/types/api/auth'
import { ContactMethod, StateTerritory } from 'common/types/api/users/ParticipantProfile'
import { GetUserProfileByIDResponse } from 'common/types/api/users'
import { getUserIdFromToken } from '../authentication'
import { Api } from '../Api'
import { resetDB } from '../../tests/TestHelpers'

const api = new Api()
const app = api.app

describe('ProfilesController', () => {
  let registeredParticipantUserID: number
  let registeredParticipantToken: string

  beforeAll(async () => {
    api.run()
  })

  beforeEach(async () => {
    await resetDB()

    // Register Participant
    const registerParticipantRequest: RegisterParticipantRequest = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'johndoe@example.com',
      password: 'GooD02Password',
      mobile: '0411111111',
      addressLine: '123 Some Street',
      suburb: 'Sydney',
      postcode: '2000',
      state: StateTerritory.NSW,
      preferredContact: ContactMethod.MOBILE,
      dob: '1990-01-02',
      studyID: 'S12345',
      participantID: 'P12345',
      isParentOrGuardian: true,
    }

    const registerParticipantResponse = await request(app)
      .post('/auth/register/participant')
      .send(registerParticipantRequest)

    const body: RegisterParticipantResponse = registerParticipantResponse.body
    registeredParticipantToken = body.token
    registeredParticipantUserID = getUserIdFromToken(registeredParticipantToken)
  })

  afterAll(async () => {
    api.stop()
  })

  describe('GET /users/:userID/profile', () => {
    it('should return the profile of a user if they exist', async () => {
      // Get user profile
      const response = await request(app)
        .get(`/profiles/${registeredParticipantUserID}`)
        .set({ Authorization: `Bearer ${registeredParticipantToken}` })

      expect(response.status).toBe(200)

      const expectedProfileData = expect.objectContaining({
        addressLine: '123 Some Street',
        dob: '1990-01-02T00:00:00.000Z',
        id: expect.any(Number),
        isParentOrGuardian: true,
        mobile: '0411111111',
        participantID: 'P12345',
        postcode: '2000',
        preferredContact: 'MOBILE',
        state: 'NSW',
        suburb: 'Sydney',
        user: {
          email: 'johndoe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          middleName: null,
        },
        userID: expect.any(Number),
      })

      const body: GetUserProfileByIDResponse = response.body
      expect(body.message).toBe(
        `Got Participant Profile with userID: ${registeredParticipantUserID}`,
      )
      expect(body.data).toEqual(expectedProfileData)
    })

    it('should return a 404 error if the user does not exist', async () => {
      const userID: number = 999
      const response = await request(app)
        .get(`/profiles/${userID}`)
        .set({ Authorization: `Bearer ${registeredParticipantToken}` })

      expect(response.status).toBe(404)
      const body = response.body
      expect(body.message).toBe('Not Found')
    })
  })
})

// Test that token and id return the same thing
