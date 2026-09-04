import request from 'supertest'
import { GetParticipantProfileResponse, UpdateProfileRequest } from 'common/types/api/users'
import { generateToken } from '../authentication'
import { Api } from '../Api'
import { resetDB } from 'common/testing/TestHelpers'
import { TestUsers } from 'common/testing/constants'
import { StateTerritory } from 'common/types/api/users/ParticipantProfile'
import prisma from '../PrismaClient'

const api = new Api()
const app = api.app

describe('ProfilesController', () => {
  let orgAdminToken: string, registeredParticipantToken: string

  beforeAll(async () => {
    orgAdminToken = await generateToken({
      userId: TestUsers.ORG_ADMIN.id,
    })
    registeredParticipantToken = await generateToken({
      userId: TestUsers.PARTICIPANT_COMPLETED.id,
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
        .get(`/profiles/${TestUsers.PARTICIPANT_COMPLETED.id}`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })

      expect(response.status).toBe(200)

      const expectedProfileData = expect.objectContaining({
        addressLine: '123 smith st',
        nextOfKin: null,
        dob: '1980-01-23',
        mobile: '0412345678',
        participantType: 'GUARDIAN',
        postcode: '1234',
        preferredContact: 'EMAIL',
        state: 'VIC',
        suburb: 'Melbourne',
        email: TestUsers.PARTICIPANT_COMPLETED.email,
        firstName: 'Completed',
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
        dob: '1980-01-23',
        mobile: '0412345678',
        participantType: 'GUARDIAN',
        postcode: '1234',
        preferredContact: 'EMAIL',
        state: 'VIC',
        suburb: 'Melbourne',
        email: TestUsers.PARTICIPANT_COMPLETED.email,
        firstName: 'Completed',
        lastName: 'User',
      })

      const body: GetParticipantProfileResponse = response.body
      expect(body.data).toEqual(expectedProfileData)
    })
  })

  describe('GET /profiles/current and GET /profiles/:userId', () => {
    it('should return the same values', async () => {
      const currentParticipantProfileResponse = await request(app)
        .get('/profiles/current')
        .set({ Authorization: `Bearer ${registeredParticipantToken}` })

      const participantProfileByIDResponse = await request(app)
        .get(`/profiles/${TestUsers.PARTICIPANT_COMPLETED.id}`)
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

      const user = await prisma.user.findUniqueOrThrow({
        where: { id: TestUsers.PARTICIPANT_COMPLETED.id },
      })
      const profile = await prisma.participantProfile.findFirstOrThrow({
        where: { userId: user.id },
      })
      expect(user.lastName).toBe('Brown')
      expect(profile.lastName).toBe('Brown')
      expect(profile.dob).toEqual('2010-12-12')
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

    it('should fail validation if provided with illegal xss values', async () => {
      const updateProfileRequest: UpdateProfileRequest = {
        firstName: "{{7*7}}<script>alert('xss-firstname')</script>${{7*7}}#{7*7}<%= 7*7 %>",
        lastName: '<script>',
        addressLine: "<script>alert('xss-address')</script>",
        suburb: "<img src=x onerror=alert('xss-suburb-img')>",
        nextOfKin: {
          firstName: 'John{7*7}',
          lastName: '<script>Smith</script>',
          email: '<script>john</script>@smith.com',
        },
      }

      const updateProfileResponse = await request(app)
        .patch('/profiles/current')
        .set({ authorization: `Bearer ${registeredParticipantToken}` })
        .send(updateProfileRequest)
      expect(updateProfileResponse.status).toEqual(422)

      const updateProfileBody = updateProfileResponse.body
      expect(updateProfileBody.message).toEqual('Validation Failed')
      expect(updateProfileBody.token).toBe(undefined)
      expect(updateProfileBody.details).toEqual({
        'bodyRequest.firstName': {
          message: 'Invalid value provided',
        },
        'bodyRequest.lastName': {
          message: 'Invalid value provided',
        },
        'bodyRequest.addressLine': {
          message: 'Invalid value provided',
        },
        'bodyRequest.suburb': {
          message: 'Invalid value provided',
        },
        'bodyRequest.nextOfKin.firstName': {
          message: 'Invalid value provided',
        },
        'bodyRequest.nextOfKin.lastName': {
          message: 'Invalid value provided',
        },
        'bodyRequest.nextOfKin.email': {
          message: 'Invalid value provided',
        },
      })
    })
  })

  describe('PATCH /profiles/:userId', () => {
    it('should fail validation if provided with illegal xss values', async () => {
      const updateProfileRequest: UpdateProfileRequest = {
        firstName: "{{7*7}}<script>alert('xss-firstname')</script>${{7*7}}#{7*7}<%= 7*7 %>",
        lastName: '<script>',
        addressLine: "<script>alert('xss-address')</script>",
        suburb: "<img src=x onerror=alert('xss-suburb-img')>",
        nextOfKin: {
          firstName: 'John{7*7}',
          lastName: '<script>Smith</script>',
          email: '<script>john</script>@smith.com',
        },
      }

      const updateProfileResponse = await request(app)
        .patch(`/profiles/${TestUsers.PARTICIPANT_COMPLETED.id}`)
        .set({ Authorization: `Bearer ${orgAdminToken}` })
        .send(updateProfileRequest)
      expect(updateProfileResponse.status).toEqual(422)

      const updateProfileBody = updateProfileResponse.body
      expect(updateProfileBody.message).toEqual('Validation Failed')
      expect(updateProfileBody.token).toBe(undefined)
      expect(updateProfileBody.details).toEqual({
        'bodyRequest.firstName': {
          message: 'Invalid value provided',
        },
        'bodyRequest.lastName': {
          message: 'Invalid value provided',
        },
        'bodyRequest.addressLine': {
          message: 'Invalid value provided',
        },
        'bodyRequest.suburb': {
          message: 'Invalid value provided',
        },
        'bodyRequest.nextOfKin.firstName': {
          message: 'Invalid value provided',
        },
        'bodyRequest.nextOfKin.lastName': {
          message: 'Invalid value provided',
        },
        'bodyRequest.nextOfKin.email': {
          message: 'Invalid value provided',
        },
      })
    })
  })
})
