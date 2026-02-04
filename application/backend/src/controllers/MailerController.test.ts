import request from 'supertest'
import { Api } from '../Api'
import { generateToken } from '../authentication'
import { resetDB } from 'common/testing/TestHelpers'
import { NodemailerMock } from 'nodemailer-mock'
import * as nodemailer from 'nodemailer'
import { PARTICIPANT_COMPLETED_ID, SECOND_TEST_STUDY_ID, TEST_STUDY_ID } from 'common/testing/seed'
const mockNodeMailer = nodemailer as unknown as NodemailerMock

const api = new Api()
const app = api.app

describe('MailerController', () => {
  let participantToken: string

  beforeAll(async () => {
    participantToken = await generateToken({
      userId: PARTICIPANT_COMPLETED_ID,
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
        .send({ content: 'Test Content', studyId: TEST_STUDY_ID })
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
        .send({ content: 'Test Content', studyId: TEST_STUDY_ID })
        .set({ Authorization: `Bearer ${participantToken}` })

      expect(response.status).toBe(204)

      const sentEmails = mockNodeMailer.mock.getSentMail()
      expect(sentEmails.length).toBe(2) // 1 to admin, 1 to user
      expect(sentEmails.map((v) => v.to)).toEqual([['test@contactus.com'], 'test3@example.com'])
    })

    it('should send emails to all Admins if Study specific contact email is not set', async () => {
      const response = await request(app)
        .post('/mailer/contact-us')
        .send({ content: 'Test Content', studyId: SECOND_TEST_STUDY_ID })
        .set({ Authorization: `Bearer ${participantToken}` })

      expect(response.status).toBe(204)
      const sentEmails = mockNodeMailer.mock.getSentMail()
      expect(sentEmails.length).toBe(2) // 1 to admin, 1 to user
      expect(sentEmails.map((v) => v.to)).toEqual([
        ['admin@example.com', 'testOrgAdmin2@example.com'],
        'test3@example.com',
      ])
    })
  })
})
