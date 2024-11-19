import request from 'supertest'
import { GetParticipantProfileResponse } from 'common/types/api/users'
import { generateToken } from '../authentication'
import { Api } from '../Api'
import { resetDB } from '../../tests/TestHelpers'

const api = new Api()
const app = api.app

describe('ProfilesController', () => {
  let registeredUserToken: string, registeredParticipantToken: string
  const registeredUserId: number = 97
  const registeredParticipantUserId: number = 99
  beforeAll(async () => {
    registeredUserToken = await generateToken(registeredUserId)
    registeredParticipantToken = await generateToken(registeredParticipantUserId)
    api.run()
  })

  beforeEach(async () => {
    await resetDB()
  })

  afterAll(async () => {
    api.stop()
  })

  describe('GET /profiles/:userId', () => {
    it('should return the profile of a user if they exist', async () => {
      // Get user profile
      const response = await request(app)
        .get(`/profiles/${registeredParticipantUserId}`)
        .set({ Authorization: `Bearer ${registeredParticipantToken}` })

      expect(response.status).toBe(200)

      const expectedProfileData = expect.objectContaining({
        addressLine: '123 smith st',
        dob: '1980-01-23T00:00:00.000Z',
        isParentOrGuardian: false,
        mobile: '0412345678',
        participantID: 'ABC123',
        postcode: '1234',
        preferredContact: 'EMAIL',
        state: 'VIC',
        suburb: 'Melbourne',
        email: 'test3@example.com',
        firstName: 'Test',
        lastName: 'User',
      })

      const body: GetParticipantProfileResponse = response.body
      expect(body.message).toBe(
        `Got Participant Profile with userId: ${registeredParticipantUserId}`,
      )
      expect(body.data).toEqual(expectedProfileData)
    })

    it('should return a 404 error if the user does not exist', async () => {
      const userId: number = 999
      const response = await request(app)
        .get(`/profiles/${userId}`)
        .set({ Authorization: `Bearer ${registeredParticipantToken}` })

      expect(response.status).toBe(404)
      const body = response.body
      expect(body.message).toBe('Not Found')
    })
  })

  describe('GET /profiles/current', () => {
    it('should return the profile of the authenticated user', async () => {
      const response = await request(app)
        .get('/profiles/current')
        .set({ Authorization: `Bearer ${registeredParticipantToken}` })

      expect(response.status).toBe(200)

      const expectedProfileData = expect.objectContaining({
        addressLine: '123 smith st',
        dob: '1980-01-23T00:00:00.000Z',
        isParentOrGuardian: false,
        mobile: '0412345678',
        participantID: 'ABC123',
        postcode: '1234',
        preferredContact: 'EMAIL',
        state: 'VIC',
        suburb: 'Melbourne',
        email: 'test3@example.com',
        firstName: 'Test',
        lastName: 'User',
      })

      const body: GetParticipantProfileResponse = response.body
      expect(body.message).toBe(
        `Got Participant Profile with userId: ${registeredParticipantUserId}`,
      )
      expect(body.data).toEqual(expectedProfileData)
    })

    it('should return a 404 error if the authenticated user does not have a profile', async () => {
      const response = await request(app)
        .get('/profiles/current')
        .set({ Authorization: `Bearer ${registeredUserToken}` })

      expect(response.status).toBe(404)
      const body = response.body
      expect(body.message).toBe('Not Found')
    })
  })

  describe('GET /profiles/current and GET /profiles/:userId', () => {
    it('should return the same values', async () => {
      const currentParticipantProfileResponse = await request(app)
        .get('/profiles/current')
        .set({ Authorization: `Bearer ${registeredParticipantToken}` })

      const participantProfileByIDResponse = await request(app)
        .get(`/profiles/${registeredParticipantUserId}`)
        .set({ Authorization: `Bearer ${registeredParticipantToken}` })

      expect(currentParticipantProfileResponse.status).toBe(200)
      expect(participantProfileByIDResponse.status).toBe(200)

      const currentUserProfileBody: GetParticipantProfileResponse =
        currentParticipantProfileResponse.body

      const participantProfileByIDBody: GetParticipantProfileResponse =
        participantProfileByIDResponse.body

      expect(participantProfileByIDBody).toEqual(currentUserProfileBody)
    })
  })
})
