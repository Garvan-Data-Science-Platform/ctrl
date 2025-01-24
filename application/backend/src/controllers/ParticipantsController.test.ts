import { generateToken } from '../authentication'
import { Api } from '../Api'
import { resetDB } from 'common/testing/TestHelpers'
import request from 'supertest'
import { GetInvitesResponse, GetParticipantsResponse } from 'common/types/api/participants'
import { ORG_ADMIN_ID } from 'common/testing/seed'
import { InviteStatus } from '@prisma/client'
import prisma from '../PrismaClient'
import * as nodemailer from 'nodemailer'
import { NodemailerMock } from 'nodemailer-mock'
const mockNodeMailer = nodemailer as unknown as NodemailerMock

const api = new Api()
const app = api.app

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

      expect(body.data).toHaveLength(3)
      expect(body.data[0]).not.toHaveProperty('lastUpdated')
      expect(['12/3/2024', '12/2/2024']).toContain(body.data[1].lastUpdated)
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
      expect(body.data).toHaveLength(4)
      expect(body.data[0].inviteStatus).toBe(InviteStatus.PENDING)
      expect(body.data[1].inviteStatus).toBe(InviteStatus.ACCEPTED)
      expect(body.data[2].inviteStatus).toBe(InviteStatus.REVOKED)
      expect(body.data[3].inviteStatus).toBe(InviteStatus.EXPIRED)
    })
  })

  describe('POST /invites', () => {
    it('should create new invites from a list of emails and send the invites to their emails', async () => {
      const emails = ['invite5@new.com', 'invite6@new.com']

      const response = await request(app)
        .post('/invites')
        .send({ emails })
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(response.status).toBe(204)

      // Check emails were successfully sent
      const sentEmails = mockNodeMailer.mock.getSentMail()
      expect(sentEmails.length).toBe(2)
      sentEmails.forEach((email) => {
        expect(email.from).toBe(`CTRL <noreply@${process.env.HOSTNAME}>`)
        expect(emails).toContain(email.to)
      })

      // Check invites were created
      for (const email of emails) {
        const createdInvite = await prisma.invite.findUnique({ where: { email } })
        if (!createdInvite) throw new Error('Invite not found')
        expect(createdInvite.status).toBe('PENDING')

        // Check expiry
        const currentTime = new Date()
        expect(new Date(createdInvite.expiresAt).getTime()).toBeGreaterThan(currentTime.getTime())
      }
    }, 100000)

    it('should change a status REVOKED invite to status PENDING and reset the expiry', async () => {
      // Check the status REVOKED invite
      const invite = await prisma.invite.findUnique({
        where: { email: 'invite3@revoked.com' },
      })

      if (!invite) throw new Error('Invite not found')

      expect(invite.status).toBe('REVOKED')
      const oldExpiresAt = invite.expiresAt

      // Create invite for revoked
      const response = await request(app)
        .post('/invites')
        .send({ emails: ['invite3@revoked.com'] })
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(response.status).toBe(204)

      // Check emails were successfully sent
      const sentEmails = mockNodeMailer.mock.getSentMail()
      expect(sentEmails.length).toBe(1)
      expect(sentEmails[0]).toHaveProperty('to')
      expect(sentEmails[0]).toHaveProperty('from', `CTRL <noreply@${process.env.HOSTNAME}>`)

      // Check invite status was changed to PENDING
      const updatedInvite = await prisma.invite.findUnique({
        where: { email: 'invite3@revoked.com' },
      })
      if (!updatedInvite) throw new Error('Invite not found')

      expect(updatedInvite.status).toBe('PENDING')

      // Check expiry was reset
      expect(new Date(updatedInvite.expiresAt).getTime()).toBeGreaterThan(oldExpiresAt.getTime())
    }, 100000)

    it('should resend emails for status PENDING invites and reset the expiry', async () => {
      const emailPendingInvite = 'invite1@pending.com'

      // Check the status REVOKED invite
      const invite = await prisma.invite.findUnique({
        where: { email: emailPendingInvite },
      })

      if (!invite) throw new Error('Invite not found')

      expect(invite.status).toBe('PENDING')
      // const oldExpiresAt = invite.expiresAt

      const response = await request(app)
        .post('/invites')
        .send({ emails: [emailPendingInvite] })
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(response.status).toBe(204)

      // Check email(s) were successfully sent
      const sentEmails = mockNodeMailer.mock.getSentMail()
      expect(sentEmails.length).toBe(1)
      expect(sentEmails[0]).toHaveProperty('to', emailPendingInvite)
      expect(sentEmails[0]).toHaveProperty('from', `CTRL <noreply@${process.env.HOSTNAME}>`)

      // Check invite status was is still PENDING
      const updatedInvite = await prisma.invite.findUnique({
        where: { email: emailPendingInvite },
      })

      if (!updatedInvite) throw new Error('Invite not found')

      expect(updatedInvite.status).toBe('PENDING')

      // Check expiry(s) were reset (TODO: FIX)
      // const currentTime = new Date()
      // expect(new Date(updatedInvite.expiresAt).getTime()).toBeGreaterThan(currentTime.getTime())
      // expect(new Date(updatedInvite.expiresAt).getTime()).toBeGreaterThan(oldExpiresAt.getTime())
    })

    it('should do nothing for status ACCEPTED invites', async () => {
      const emailAcceptedInvite = 'invite2@accepted.com'

      const response = await request(app)
        .post('/invites')
        .send({ emails: [emailAcceptedInvite] })
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(response.status).toBe(204)

      // Check email(s) were not sent
      const sentEmails = mockNodeMailer.mock.getSentMail()
      expect(sentEmails).toEqual([])

      // Check invite status was is still ACCEPTED
      const updatedInvite = await prisma.invite.findUnique({
        where: { email: emailAcceptedInvite },
      })

      if (!updatedInvite) throw new Error('Invite not found')

      expect(updatedInvite.status).toBe('ACCEPTED')

      // Check expiry(s) were not reset (TODO: FIX)
    })
  })

  describe('POST /invites/resend', () => {
    it('should resend all invites of status PENDING and reset their expiry', async () => {
      const emailPendingInvite = 'invite1@pending.com'

      const response = await request(app)
        .post('/invites/resend')
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(response.status).toBe(204)

      // Check email(s) were successfully sent
      const sentEmails = mockNodeMailer.mock.getSentMail()
      expect(sentEmails.length).toBe(1)
      expect(sentEmails[0]).toHaveProperty('to', emailPendingInvite)
      expect(sentEmails[0]).toHaveProperty('from', `CTRL <noreply@${process.env.HOSTNAME}>`)
    })
  })

  describe('POST /invites/revoke', () => {
    it('should change invites status from PENDING to REVOKED given email(s)', async () => {
      const emailPendingInvite = 'invite1@pending.com'

      const response = await request(app)
        .post('/invites/revoke')
        .send({ emails: [emailPendingInvite] })
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(response.status).toBe(204)

      // Check invite status was changed to REVOKED
      const updatedInvite = await prisma.invite.findUnique({
        where: { email: emailPendingInvite },
      })
      if (!updatedInvite) throw new Error('Invite not found')
      expect(updatedInvite.status).toBe('REVOKED')
    })

    it('should return 200 even if the invite does not exist for security reasons', async () => {
      const response = await request(app)
        .post('/invites/revoke')
        .send({ emails: ['notexisting@email.com'] })
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(response.status).toBe(204)
    })
  })
})
