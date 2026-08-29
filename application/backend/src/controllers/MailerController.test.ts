import request from 'supertest'
import { Api } from '../Api'
import { generateToken } from '../authentication'
import { resetDB } from 'common/testing/TestHelpers'
import { NodemailerMock } from 'nodemailer-mock'
import * as nodemailer from 'nodemailer'
import { TestUsers, TestStudies } from 'common/testing/constants'
const mockNodeMailer = nodemailer as unknown as NodemailerMock

const api = new Api()
const app = api.app

describe('MailerController', () => {
  let participantToken: string

  beforeAll(async () => {
    participantToken = await generateToken({
      userId: TestUsers.PARTICIPANT_COMPLETED.id,
    })

    api.run()
  })

  beforeEach(async () => {
    await resetDB()
  })

  afterEach(async () => {
    mockNodeMailer.mock.reset()
  })

  afterAll(async () => {
    api.stop()
  })

  describe('POST /mailer/contact-us', () => {
    it('should successfully send emails', async () => {
      const response = await request(app)
        .post('/mailer/contact-us')
        .send({ content: 'Test Content', studyId: TestStudies.TEST_STUDY.id })
        .set({ Authorization: `Bearer ${participantToken}` })

      expect(response.status).toBe(204)

      const sentEmails = mockNodeMailer.mock.getSentMail()
      expect(sentEmails.length).toBe(2) // 1 to admin, 1 to user
    }, 100000)

    it('should ensure that the user exists before sending email', async () => {
      const invalidToken = await generateToken({
        userId: -1, // Non-existent user ID
      })

      const response = await request(app)
        .post('/mailer/contact-us')
        .send({ subject: 'Test Subject', content: 'Test Content' })
        .set({ Authorization: `Bearer ${invalidToken}` })

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Record not found')
    }, 100000)

    it('should send emails to Study specific email if it is set', async () => {
      const response = await request(app)
        .post('/mailer/contact-us')
        .send({ content: 'Test Content', studyId: TestStudies.TEST_STUDY.id })
        .set({ Authorization: `Bearer ${participantToken}` })

      expect(response.status).toBe(204)

      const sentEmails = mockNodeMailer.mock.getSentMail()
      expect(sentEmails.length).toBe(2) // 1 to admin, 1 to user
      expect(sentEmails.map((v) => v.to)).toEqual([
        ['test@contactus.com'],
        TestUsers.PARTICIPANT_COMPLETED.email,
      ])
    })

    it('should keep the participant name out of the admin subject but not out of the body', async () => {
      const response = await request(app)
        .post('/mailer/contact-us')
        .send({ content: 'Test Content', studyId: TestStudies.TEST_STUDY.id })
        .set({ Authorization: `Bearer ${participantToken}` })

      expect(response.status).toBe(204)

      // User.firstName and User.lastName are `/// @encrypted` in schema.prisma, and a
      // subject reaches our logs, the mail server's, and Message Trace. The body still
      // names them so admins can still tell requests apart.
      const [toAdmin] = mockNodeMailer.mock.getSentMail()
      expect(toAdmin.subject).toBe('New Contact Us Request From a CTRL Participant')
      expect(toAdmin.text).toContain('Participant: Test User')
    })

    it('should send emails to all Admins if Study specific contact email is not set', async () => {
      const response = await request(app)
        .post('/mailer/contact-us')
        .send({ content: 'Test Content', studyId: TestStudies.TEST_STUDY_2.id })
        .set({ Authorization: `Bearer ${participantToken}` })

      expect(response.status).toBe(204)
      const sentEmails = mockNodeMailer.mock.getSentMail()
      expect(sentEmails.length).toBe(2) // 1 to admin, 1 to user
      expect(sentEmails.map((v) => v.to)).toEqual([
        [TestUsers.ORG_ADMIN.email, TestUsers.ORG_ADMIN_2.email],
        TestUsers.PARTICIPANT_COMPLETED.email,
      ])
    })
  })
})
