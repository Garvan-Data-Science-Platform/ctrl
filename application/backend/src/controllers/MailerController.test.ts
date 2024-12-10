import request from 'supertest'
import { Api } from '../Api'
import { generateToken } from '../authentication'
import { resetDB } from '../../tests/TestHelpers'
import { Role } from '@prisma/client'
import { NodemailerMock } from 'nodemailer-mock'
import * as nodemailer from 'nodemailer'
const mockNodeMailer = nodemailer as unknown as NodemailerMock

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

      const expectedSentEmails = [
        {
          from: 'CTRL <noreply@ctrl.garvan.org.au>',
          headers: {},
          subject: 'New Contact Us Request RE:Test Subject',
          text: 'Test Content',
          to: 'testorg-admin@testorg.org.au',
        },
        {
          from: 'CTRL <noreply@ctrl.garvan.org.au>',
          headers: {},
          subject: 'Copy of your message submitted to CTRL Administration Team RE: Test Subject',
          text: 'Test Content',
          to: 'test3@example.com',
        },
      ]

      const sentEmails = mockNodeMailer.mock.getSentMail()
      expect(sentEmails.length).toBe(2) // 1 to admin, 1 to user
      expect(sentEmails).toEqual(expectedSentEmails)
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
      expect(response.body.message).toBe('Record not found')
    }, 100000)
  })
})
