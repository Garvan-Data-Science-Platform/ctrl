import { generateToken } from '../authentication'
import { Api } from '../Api'
import { resetDB } from 'common/testing/TestHelpers'
import request from 'supertest'
import {
  GetInvitesResponse,
  GetParticipantsResponse,
  InviteParticipantsResponse,
} from 'common/types/api/participants'
import { ORG_ADMIN_ID } from 'common/testing/seed'
import { InviteStatus } from '@prisma/client'
import prisma from '../PrismaClient'
import * as nodemailer from 'nodemailer'
import { NodemailerMock } from 'nodemailer-mock'
const mockNodeMailer = nodemailer as unknown as NodemailerMock

const api = new Api()
const app = api.app

const expectedNumberOfInvites = 6

describe('ParticipantsController', () => {
  let registeredUserToken: string

  beforeAll(async () => {
    registeredUserToken = await generateToken({
      userId: ORG_ADMIN_ID,
      roles: ['OrganisationAdmin'],
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
    it('Returns participant list', async () => {
      const response = await request(app)
        .get('/participants')
        .set({ Authorization: `Bearer ${registeredUserToken}` })
      const body: GetParticipantsResponse = response.body
      expect(response.status).toBe(200)

      expect(body.data).toHaveLength(4)
      expect(body.data[0]).not.toHaveProperty('lastUpdated')
      expect(body.data[1].lastUpdated).toBe(
        new Date('2024-12-02T02:38:01.195Z').toLocaleDateString(),
      )
      expect(body.data[1].answers).toHaveLength(1)
      expect(body.data[1].answers[0].status).toBe('complete')
    })
  })
})

describe('InvitesController', () => {
  let organisationAdminToken: string

  beforeAll(async () => {
    organisationAdminToken = await generateToken({
      userId: ORG_ADMIN_ID,
      roles: ['OrganisationAdmin'],
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

  describe('GET /invites', () => {
    it('should return a list of all existing invites', async () => {
      const response = await request(app)
        .get('/invites')
        .set({ Authorization: `Bearer ${organisationAdminToken}` })
      expect(response.status).toBe(200)

      const body: GetInvitesResponse = response.body
      expect(body.data).toHaveLength(expectedNumberOfInvites)
      expect(body.data[0].inviteStatus).toBe(InviteStatus.PENDING)
      expect(body.data[1].inviteStatus).toBe(InviteStatus.REVOKED)
      expect(body.data[2].inviteStatus).toBe(InviteStatus.EXPIRED)
      expect(body.data[3].inviteStatus).toBe(InviteStatus.PENDING)
      expect(body.data[4].inviteStatus).toBe(InviteStatus.PENDING)
      expect(body.data[5].inviteStatus).toBe(InviteStatus.PENDING)
    })
  })

  describe('POST /invites', () => {
    it('should create new invites from a list of emails, return data about how many new invites were created, and send the invites to their emails', async () => {
      const emails = ['invite5@new.com', 'invite6@new.com']

      const response = await request(app)
        .post('/invites')
        .send({ emails, subjectText: 'Subject Text', explanatoryText: 'Explanatory Text' })
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      const body: InviteParticipantsResponse = response.body
      expect(response.status).toBe(200)

      expect(body.newInvitesCount).toBe(2)

      // Check emails were successfully sent
      const sentEmails = mockNodeMailer.mock.getSentMail()
      expect(sentEmails.length).toBe(2)
      sentEmails.forEach((email) => {
        expect(email.from).toBe(`CTRL <noreply@${process.env.HOSTNAME}>`)
        expect(emails).toContain(email.to)
        expect(email.subject).toBe('Subject Text')
        expect(email.html).toContain('Explanatory Text')
      })

      const study = await prisma.study.findFirstOrThrow({})
      expect(study.inviteEmailSubject).toBe('Subject Text')
      expect(study.inviteEmailText).toBe('Explanatory Text')

      // Check invites were created
      for (const email of emails) {
        const createdInvite = await prisma.invite.findUnique({ where: { email } })
        expect(createdInvite).toBeDefined()

        // See link about non-null assertion operator https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-0.html#non-null-assertion-operator
        expect(createdInvite!.status).toBe('PENDING')

        // Check expiry
        const currentTime = new Date()
        expect(new Date(createdInvite!.expiresAt).getTime()).toBeGreaterThan(currentTime.getTime())
      }
    }, 100000)

    it('should change a status REVOKED invite to status PENDING and reset the expiry', async () => {
      // Check the status REVOKED invite
      const invite = await prisma.invite.findUnique({
        where: { email: 'invite3@revoked.com' },
      })

      expect(invite).toBeDefined()

      expect(invite!.status).toBe('REVOKED')
      const oldExpiresAt = invite!.expiresAt

      // Create invite for revoked
      const response = await request(app)
        .post('/invites')
        .send({ emails: ['invite3@revoked.com'], subjectText: 'ABC', explanatoryText: '123' })
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      const body: InviteParticipantsResponse = response.body
      expect(response.status).toBe(200)
      expect(body.emailsResentCount).toBe(1)
      expect(body.alreadyAcceptedCount).toBe(0)
      expect(body.newInvitesCount).toBe(0)
      expect(body.failedEmailsCount).toBe(0)

      // Check emails were successfully sent
      const sentEmails = mockNodeMailer.mock.getSentMail()
      expect(sentEmails.length).toBe(1)
      expect(sentEmails[0]).toHaveProperty('to')
      expect(sentEmails[0]).toHaveProperty('from', `CTRL <noreply@${process.env.HOSTNAME}>`)

      // Check invite status was changed to PENDING
      const updatedInvite = await prisma.invite.findUnique({
        where: { email: 'invite3@revoked.com' },
      })
      expect(updatedInvite).toBeDefined()

      expect(updatedInvite!.status).toBe('PENDING')

      // Check expiry was reset
      expect(new Date(updatedInvite!.expiresAt).getTime()).toBeGreaterThan(oldExpiresAt.getTime())
    }, 100000)

    it('should resend emails for status PENDING invites and reset the expiry', async () => {
      const emailPendingInvite = 'john@example.com'

      // Check the status REVOKED invite
      const invite = await prisma.invite.findUnique({
        where: { email: emailPendingInvite },
      })

      expect(invite).toBeDefined()

      expect(invite!.status).toBe('PENDING')
      const oldExpiresAt = invite!.expiresAt

      const response = await request(app)
        .post('/invites')
        .send({ emails: [emailPendingInvite], subjectText: 'ABC', explanatoryText: '123' })
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      const body: InviteParticipantsResponse = response.body
      expect(response.status).toBe(200)
      expect(body.emailsResentCount).toBe(1)
      expect(body.alreadyAcceptedCount).toBe(0)
      expect(body.newInvitesCount).toBe(0)
      expect(body.failedEmailsCount).toBe(0)

      // Check email(s) were successfully sent
      const sentEmails = mockNodeMailer.mock.getSentMail()
      expect(sentEmails.length).toBe(1)
      expect(sentEmails[0]).toHaveProperty('to', emailPendingInvite)
      expect(sentEmails[0]).toHaveProperty('from', `CTRL <noreply@${process.env.HOSTNAME}>`)

      // Check invite status was is still PENDING
      const updatedInvite = await prisma.invite.findUnique({
        where: { email: emailPendingInvite },
      })

      expect(updatedInvite).toBeDefined()

      expect(updatedInvite!.status).toBe('PENDING')

      // Check expiry(s) are in the future, and were reset
      const currentTime = new Date()
      expect(new Date(updatedInvite!.expiresAt).getTime()).toBeGreaterThan(currentTime.getTime())
      expect(new Date(updatedInvite!.expiresAt).getTime()).toBeGreaterThan(
        new Date(oldExpiresAt).getTime(),
      )
    })

    it('should do nothing for status ACCEPTED invites', async () => {
      const emailAcceptedInvite = 'invite2@accepted.com'

      const response = await request(app)
        .post('/invites')
        .send({ emails: [emailAcceptedInvite], subjectText: 'ABC', explanatoryText: '123' })
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      const body: InviteParticipantsResponse = response.body
      expect(response.status).toBe(200)
      expect(body.alreadyAcceptedCount).toBe(1)

      // Check email(s) were not sent
      const sentEmails = mockNodeMailer.mock.getSentMail()
      expect(sentEmails).toEqual([])

      // Check invite status was is still ACCEPTED
      const updatedInvite = await prisma.invite.findUnique({
        where: { email: emailAcceptedInvite },
      })

      expect(updatedInvite).toBeDefined()

      expect(updatedInvite!.status).toBe('ACCEPTED')

      // Check expiry(s) were not reset (TODO: FIX)
    })

    it('should handle failed email sends correctly', async () => {
      mockNodeMailer.mock.setShouldFail(true)
      const emails = [
        { email: 'will.fail0@email.com', expectedStatus: 'FAILED_TO_SEND' },
        { email: 'will.fail1@email.com', expectedStatus: 'FAILED_TO_SEND' },
        { email: 'will.fail2@email.com', expectedStatus: 'FAILED_TO_SEND' },
        { email: 'will.fail3@email.com', expectedStatus: 'FAILED_TO_SEND' },
      ]

      const response = await request(app)
        .post('/invites')
        .send({
          emails: emails.map((e) => e.email),
          subjectText: 'Subject Text',
          explanatoryText: 'Explanatory Text',
        })
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      const body: InviteParticipantsResponse = response.body
      console.log('Response body:', body)
      expect(response.status).toBe(200)

      // Check counters in response
      expect(body.newInvitesCount).toBe(4) // Invites are created even if email fails
      expect(body.failedEmailsCount).toBe(4) // One email failed to send
      expect(body.emailsResentCount).toBe(0)
      expect(body.alreadyAcceptedCount).toBe(0)

      // Check emails attempts
      const sentEmails = mockNodeMailer.mock.getSentMail()
      expect(sentEmails.length).toBe(0)

      // Verify invites were still created in database despite email failure
      for (const e of emails) {
        const createdInvite = await prisma.invite.findUnique({ where: { email: e.email } })
        expect(createdInvite).toBeDefined()
        expect(createdInvite!.status).toBe(e.expectedStatus)
      }

      // Reset mock for other tests
      mockNodeMailer.mock.reset()
    })
  })

  describe('POST /invites/resend', () => {
    it('should resend all invites of status PENDING and reset their expiry', async () => {
      const emailPendingInvite = 'invite1@pending.com'

      await prisma.study.update({
        where: { id: 1 },
        data: { inviteEmailSubject: 'New Subject', inviteEmailText: 'New Text' },
      })

      const response = await request(app)
        .post('/invites/resend')
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(response.status).toBe(204)

      // Check email(s) were successfully sent
      const sentEmails = mockNodeMailer.mock.getSentMail()
      expect(sentEmails.length).toBe(4)
      expect(sentEmails).toEqual(
        expect.arrayContaining([expect.objectContaining({ to: emailPendingInvite })]),
      )
      expect(sentEmails[0]).toHaveProperty('from', `CTRL <noreply@${process.env.HOSTNAME}>`)
      expect(sentEmails[0].subject).toBe('New Subject')
      expect(sentEmails[0].html).toContain('New Text')
      expect(sentEmails[0].text).toContain('New Text')
    })
  })

  describe('POST /invites/revoke', () => {
    it('should change invites status from PENDING to REVOKED given email(s)', async () => {
      const emailPendingInvite = 'invite1@pending.com'

      const invite = await prisma.invite.findUnique({
        where: { email: emailPendingInvite },
      })

      expect(invite).toBeDefined()
      expect(invite!.status).toBe('PENDING')

      const response = await request(app)
        .post(`/invites/revoke/${invite!.id}`)
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(response.status).toBe(204)

      // Check invite status was changed to REVOKED
      const updatedInvite = await prisma.invite.findUnique({
        where: { email: emailPendingInvite },
      })
      expect(updatedInvite).toBeDefined()
      expect(updatedInvite!.status).toBe('REVOKED')
    })

    it('should return error if revoking an invite that does not exist', async () => {
      const response = await request(app)
        .post('/invites/revoke')
        .send({ inviteId: expectedNumberOfInvites + 1 })
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(response.status).toBe(404)
    })
  })

  describe('GET /invites/text', () => {
    it('should return current invites text', async () => {
      await prisma.study.update({
        where: { id: 1 },
        data: { inviteEmailSubject: 'Subject', inviteEmailText: 'Text' },
      })

      const response = await request(app)
        .get('/invites/text')
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(response.body).toStrictEqual({
        inviteEmailSubject: 'Subject',
        inviteEmailText: 'Text',
      })
    })
  })
})
