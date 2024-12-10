import request from 'supertest'
import { Api } from '../Api'
import { generateToken } from '../authentication'
import { resetDB } from '../../tests/TestHelpers'
import { Role } from '@prisma/client'

const api = new Api()
const app = api.app

describe('MailerController', () => {
  let participantToken: string
  const registeredParticipantUserID: number = 99

  beforeAll(async () => {
    participantToken = await generateToken({
      userId: registeredParticipantUserID,
      roles: [Role.Participant],
    })

    api.run()
  })

  beforeEach(async () => {
    await resetDB()
  })

  afterAll(async () => {
    api.stop()
  })

  describe('POST /mailer/contact-us', () => {
    it('should successfully send emails', async () => {
      const response = await request(app)
        .post('/mailer/contact-us')
        .send({ subject: 'Test Subject', content: 'Test Content' })
        .set({ Authorization: `Bearer ${participantToken}` })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Contact us request successfully sent to admin team.',
      })
    }, 100000)

    it('should ensure that the user exists before sending email', async () => {
      const invalidToken = await generateToken({
        userId: -1, // Non-existent user ID
        roles: [Role.Participant],
      })

      const response = await request(app)
        .post('/mailer/contact-us')
        .send({ subject: 'Test Subject', content: 'Test Content' })
        .set({ Authorization: `Bearer ${invalidToken}` })

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('User not found')
    }, 100000)
  })
})
