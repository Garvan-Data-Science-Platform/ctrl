import request from 'supertest'
import { GetParticipantProfileResponse, UpdateProfileRequest } from 'common/types/api/users'
import { generateToken } from '../authentication'
import { Api } from '../Api'
import { resetDB } from 'common/testing/TestHelpers'
import { ORG_ADMIN_ID, PARTICIPANT_COMPLETED_ID } from 'common/testing/seed'
import { StateTerritory } from 'common/types/api/users/ParticipantProfile'
import prisma from '../PrismaClient'

const api = new Api()
const app = api.app

describe('ProfilesController', () => {
  let orgAdminToken: string, registeredParticipantToken: string

  beforeAll(async () => {
    orgAdminToken = await generateToken({
      userId: ORG_ADMIN_ID,
      roles: ['OrganisationAdmin'],
    })
    registeredParticipantToken = await generateToken({
      userId: PARTICIPANT_COMPLETED_ID,
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

  describe('GET /profiles/:userId', () => {
    it('should return the profile of a user if they exist', async () => {
      // Get user profile
      const response = await request(app)
        .get(`/profiles/${PARTICIPANT_COMPLETED_ID}`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })

      expect(response.status).toBe(200)

      const expectedProfileData = expect.objectContaining({
        addressLine: '123 smith st',
        nextOfKin: null,
        dob: '1980-01-23T00:00:00.000Z',
        mobile: '0412345678',
        participantType: 'GUARDIAN',
        postcode: '1234',
        preferredContact: 'EMAIL',
        state: 'VIC',
        suburb: 'Melbourne',
        email: 'test3@example.com',
        familyId: 100,
        firstName: 'Test',
        lastName: 'User',
        familyMembers: [
          { id: 100, firstName: 'Test', lastName: 'Dependent', participantType: 'DEPENDENT_AGE' },
          { id: 102, firstName: 'Second', lastName: 'Guardian', participantType: 'GUARDIAN' },
        ],
      })

      const body: GetParticipantProfileResponse = response.body
      expect(body.data).toEqual(expectedProfileData)
    })

    it('should return a 404 error if the user does not exist', async () => {
      const userId: number = 999
      const response = await request(app)
        .get(`/profiles/${userId}`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })

      expect(response.status).toBe(404)
      const body = response.body
      expect(body.message).toBe(`Record not found`)
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
        mobile: '0412345678',
        participantType: 'GUARDIAN',
        postcode: '1234',
        preferredContact: 'EMAIL',
        state: 'VIC',
        suburb: 'Melbourne',
        email: 'test3@example.com',
        firstName: 'Test',
        lastName: 'User',
      })

      const body: GetParticipantProfileResponse = response.body
      expect(body.data).toEqual(expectedProfileData)
    })

    it('should return a 404 error if the authenticated user does not have a profile', async () => {
      const response = await request(app)
        .get('/profiles/current')
        .set({ Authorization: `Bearer ${orgAdminToken}` })

      expect(response.status).toBe(404)
      const body = response.body
      expect(body.message).toBe(`Record not found`)
    })
  })

  describe('GET /profiles/current and GET /profiles/:userId', () => {
    it('should return the same values', async () => {
      const currentParticipantProfileResponse = await request(app)
        .get('/profiles/current')
        .set({ Authorization: `Bearer ${registeredParticipantToken}` })

      const participantProfileByIDResponse = await request(app)
        .get(`/profiles/${PARTICIPANT_COMPLETED_ID}`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })

      expect(currentParticipantProfileResponse.status).toBe(200)
      expect(participantProfileByIDResponse.status).toBe(200)

      const currentUserProfileBody: GetParticipantProfileResponse =
        currentParticipantProfileResponse.body

      const participantProfileByIDBody: GetParticipantProfileResponse =
        participantProfileByIDResponse.body

      expect(participantProfileByIDBody).toEqual(currentUserProfileBody)
    })
  })

  describe('PATCH /profiles/current', () => {
    it('should update an existing profile', async () => {
      const reqBody: UpdateProfileRequest = {
        lastName: 'Brown',
        dob: '2010-12-12',
        state: StateTerritory.QLD,
      }

      const response = await request(app)
        .patch('/profiles/current')
        .set({ authorization: `Bearer ${registeredParticipantToken}` })
        .send(reqBody)
      expect(response.status).toBe(204)

      const user = await prisma.user.findUniqueOrThrow({ where: { id: PARTICIPANT_COMPLETED_ID } })
      const profile = await prisma.participantProfile.findFirstOrThrow({
        where: { userId: user.id },
      })
      expect(user.lastName).toBe('Brown')
      expect(profile.lastName).toBe('Brown')
      expect(profile.dob).toEqual(new Date('2010-12-12'))
      expect(profile.state).toBe('QLD')

      const aLog = await prisma.auditLog.findFirstOrThrow({ where: { userId: user.id } })
      expect(aLog.resource).toBe('profiles')
      expect(aLog.operation).toBe('UPDATE')
      expect((aLog.meta as any).resourceId).toBe('current')
    })

    it('should reject invalid data', async () => {
      for (const body of [{ state: 'ABC' }, { firstName: '' }, { mobile: 'ABC' }]) {
        const response = await request(app)
          .patch('/profiles/current')
          .set({ authorization: `Bearer ${registeredParticipantToken}` })
          .send(body)
        expect(response.status).toBe(422)
        expect(response.body.message).toBe('Validation Failed')
      }
    })
  })
})
