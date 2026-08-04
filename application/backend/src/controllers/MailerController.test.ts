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

// Test due to nodemailer moving to more strict sender address parsing
describe('Mailer Configuration', () => {
  const originalHostname = process.env.HOSTNAME

  beforeEach(() => {
    jest.resetModules()
  })

  afterEach(() => {
    process.env.HOSTNAME = originalHostname
  })

  it('should strip http:// and ports from HOSTNAME in fromAddress', async () => {
    // non RFC-compliant environment variable
    process.env.HOSTNAME = 'http://localhost:5173'

    const mailerModule = await import('../utils/mailer')

    expect(mailerModule!.fromAddress).toBe('CTRL <noreply@localhost>')
  })

  it('should handle plain domains without protocols', async () => {
    process.env.HOSTNAME = 'production-domain.com'

    const mailerModule = await import('../utils/mailer')

    expect(mailerModule!.fromAddress).toBe('CTRL <noreply@production-domain.com>')
  })
})
