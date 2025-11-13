import { generateToken } from '../authentication'
import { Api } from '../Api'
import { resetDB, inviteUser } from 'common/testing/TestHelpers'
import request from 'supertest'
import {
  GetInvitesResponse,
  GetParticipantsResponse,
  InviteParticipantsResponse,
} from 'common/types/api/participants'
import {
  ORG_ADMIN_ID,
  PARTICIPANT_UNANSWERED_ID,
  PARTICIPANT_UNANSWERED_EMAIL,
  PASSWORD_RESET_USER_ID,
  SECOND_TEST_STUDY_ID,
  PARTICIPANT_COMPLETED_EMAIL,
  PARTICIPANT_COMPLETED_ID,
} from 'common/testing/seed'
import { InviteStatus, Role } from '@prisma/client'
import prisma from '../PrismaClient'
import { hashPassword } from '../authentication'
import * as nodemailer from 'nodemailer'
import { NodemailerMock } from 'nodemailer-mock'
const mockNodeMailer = nodemailer as unknown as NodemailerMock

const api = new Api()
const app = api.app

const expectedNumberOfInvites = 6

describe('ParticipantsController', () => {
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

  afterAll(async () => {
    api.stop()
  })

  describe('GET /participants', () => {
    it('Returns participant list', async () => {
      const response = await request(app)
        .get('/studies/1/participants')
        .set({ Authorization: `Bearer ${organisationAdminToken}` })
      const body: GetParticipantsResponse = response.body
      expect(response.status).toBe(200)

      expect(body.data).toHaveLength(4)
      expect(body.data[0]).not.toHaveProperty('lastUpdated')
      expect(new Date(body.data[1].lastUpdated || 0).toLocaleDateString()).toBe(
        new Date('2024-12-02T02:38:01.195Z').toLocaleDateString(),
      )
      expect(body.data[1].answers).toHaveLength(1)
      expect(body.data[1].answers[0].status).toBe('complete')

      const res2 = await request(app)
        .get('/studies/1/participants?_start=0&_end=2')
        .set({ Authorization: `Bearer ${organisationAdminToken}` })
      expect(res2.body.data).toHaveLength(2)

      const res3 = await request(app)
        .get('/studies/1/participants?_start=2&_end=4')
        .set({ Authorization: `Bearer ${organisationAdminToken}` })
      expect([...res2.body.data, ...res3.body.data]).toEqual(body.data)
    })
    it('Can filter', async () => {
      const res = await request(app)
        .get('/studies/1/participants?_start=0&_end=10&filter[lastName][eq]=User')
        .set({ Authorization: `Bearer ${organisationAdminToken}` })
      expect(res.body.data).toHaveLength(2)
    })
  })

  describe('POST /participants/{profileId}', () => {
    it('Can add an existing dependent to a study, if their guardian is in the study', async () => {
      const profileData = await prisma.participantProfile.findFirstOrThrow({})
      await prisma.participantProfile.create({
        data: {
          ...profileData,
          individualId: undefined,
          id: 500,
          familyId: 100,
          participantType: 'DEPENDENT_AGE',
          userId: null,
        },
      })
      const response = await request(app)
        .post('/studies/1/participants/500')
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(response.ok).toBeTruthy()

      const p = await prisma.studyParticipant.findFirst({
        where: { participantProfileId: 500, studyId: 1 },
      })
      expect(p).not.toBeNull()
    })

    it('Fails to add dependent if guardian is not in the study', async () => {
      const profileData = await prisma.participantProfile.findFirstOrThrow({})
      await prisma.participantProfile.create({
        data: {
          ...profileData,
          individualId: undefined,
          id: 500,
          familyId: 100,
          participantType: 'DEPENDENT_AGE',
        },
      })
      const response = await request(app)
        .post('/studies/3/participants/500')
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(response.ok).toBeFalsy()

      const p = await prisma.studyParticipant.findFirst({
        where: { participantProfileId: 500, studyId: 1 },
      })
      expect(p).toBeNull()
    })

    it('Can add a deleted participant back to a study', async () => {
      await prisma.studyParticipant.update({
        where: {
          participantProfileId_studyId: {
            participantProfileId: PARTICIPANT_UNANSWERED_ID,
            studyId: 1,
          },
        },
        data: { deleted: true },
      })

      const response = await request(app)
        .post(`/studies/1/participants/${PARTICIPANT_UNANSWERED_ID}`)
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(response.ok).toBeTruthy()

      const p = await prisma.studyParticipant.findFirstOrThrow({
        where: { participantProfileId: PARTICIPANT_UNANSWERED_ID, studyId: 1 },
      })
      expect(p.deleted).toBeFalsy()
    })

    it('Cannot add a participant who is part of another study (they must be invited)', async () => {
      const response = await request(app)
        .post(`/studies/4/participants/${PARTICIPANT_UNANSWERED_ID}`)
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(response.ok).toBeFalsy()

      const p = await prisma.studyParticipant.findFirst({
        where: { participantProfileId: PARTICIPANT_UNANSWERED_ID, studyId: 4 },
      })
      expect(p).toBeNull()
    })
  })

  describe('DELETE /participants/{profileId}', () => {
    it('Can remove a participant from a study', async () => {
      const response = await request(app)
        .delete(`/studies/1/participants/${PARTICIPANT_COMPLETED_ID}`)
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(response.ok).toBeTruthy()
      const p = await prisma.studyParticipant.findFirstOrThrow({
        where: { participantProfileId: PARTICIPANT_COMPLETED_ID, studyId: 1, deleted: true },
      })
      expect(p.deleted).toBeTruthy()
      const ans = await prisma.surveyVersionAnswers.findFirstOrThrow({
        where: { profile: { firstName: 'Test', lastName: 'Dependent' } },
      })
      expect(ans.answers[1].answers[0]).toBeNull()
    })
  })

  describe('GET /participants/deleted', () => {
    it('Lists deleted participants', async () => {
      const res1 = await request(app)
        .get('/participants/deleted')
        .set({ Authorization: `Bearer ${organisationAdminToken}` })
      expect(res1.ok).toBe(true)
      expect(res1.body.data).toHaveLength(0)
      await prisma.studyParticipant.delete({
        where: {
          participantProfileId_studyId: {
            participantProfileId: PARTICIPANT_UNANSWERED_ID,
            studyId: 1,
          },
        },
      })
      const res2 = await request(app)
        .get('/participants/deleted')
        .set({ Authorization: `Bearer ${organisationAdminToken}` })
      expect(res2.ok).toBe(true)
      expect(res2.body.data).toHaveLength(1)
      expect(res2.body.data[0].profileId).toBe(PARTICIPANT_UNANSWERED_ID)
    })
  })

  describe('PATCH /participants/{profileId}/restore', () => {
    it('Fails if participant is not deleted', async () => {
      const res = await request(app)
        .patch(`/studies/1/participants/${PARTICIPANT_UNANSWERED_ID}/restore`)
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(res.ok).toBe(false)
      expect(res.status).toBe(404)
    })
    it('Restores a deleted participant', async () => {
      await prisma.studyParticipant.delete({
        where: {
          participantProfileId_studyId: {
            participantProfileId: PARTICIPANT_UNANSWERED_ID,
            studyId: 1,
          },
        },
      })

      const res = await request(app)
        .patch(`/studies/1/participants/${PARTICIPANT_UNANSWERED_ID}/restore`)
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(res.ok).toBe(true)

      const participant = await prisma.studyParticipant.findFirst({
        where: {
          participantProfileId: PARTICIPANT_UNANSWERED_ID,
          studyId: 1,
        },
      })
      expect(participant).not.toBeNull()
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

  describe('GET /studies/{studyId}/invites', () => {
    it('should return a list of all existing invites for a study', async () => {
      const response = await request(app)
        .get('/studies/1/invites')
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

  describe('POST /studies/{studyId}/invites', () => {
    it('should not create invites if a study does not yet have a published survey', async () => {
      const recipients = [
        { email: 'invite5@new.com', prefill: {} },
        { email: 'invite6@new.com', prefill: {} },
      ]
      const studyId = 2

      await prisma.surveyVersion.update({
        where: {
          studyId_versionNumber: {
            studyId: studyId,
            versionNumber: 1,
          },
        },
        data: {
          status: 'DRAFT',
        },
      })

      const response = await request(app)
        .post(`/studies/${studyId}/invites`)
        .send({ recipients, subjectText: 'Subject Text', explanatoryText: 'Explanatory Text' })
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(response.status).toBe(404)

      expect(response.body.message).toBe(
        `No published survey found for study ${studyId}. A published survey is required before invites can be sent.`,
      )
    })

    it('should create new study invites from a list of emails, return data about how many new invites were created, and send the invites to their emails', async () => {
      const recipients = [
        { email: 'invite5@new.com', prefill: {} },
        { email: 'invite6@new.com', prefill: {} },
      ]

      const response = await request(app)
        .post('/studies/1/invites')
        .send({ recipients, subjectText: 'Subject Text', explanatoryText: 'Explanatory Text' })
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      const body: InviteParticipantsResponse = response.body
      expect(response.status).toBe(200)

      expect(body.newInvitesCount).toBe(2)

      // Check emails were successfully sent
      const sentEmails = mockNodeMailer.mock.getSentMail()
      expect(sentEmails.length).toBe(2)
      sentEmails.forEach((email) => {
        expect(email.from).toBe(`CTRL <noreply@${process.env.HOSTNAME}>`)
        expect(recipients.map((r) => r.email)).toContain(email.to)
        expect(email.subject).toBe('Subject Text')
        expect(email.html).toContain('Explanatory Text')
      })

      const study = await prisma.study.findFirstOrThrow({
        where: { id: 1 },
      })
      expect(study.inviteEmailSubject).toBe('Subject Text')
      expect(study.inviteEmailText).toBe('Explanatory Text')

      // Check invites were created
      for (const r of recipients) {
        const createdInvite = await prisma.invite.findUnique({
          where: {
            studyId_emailHash: {
              //@ts-ignore
              email: r.email,
              studyId: 1,
            },
          },
        })
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
        where: {
          studyId_emailHash: {
            //@ts-ignore
            email: 'invite3@revoked.com',
            studyId: 1,
          },
        },
      })

      expect(invite).toBeDefined()

      expect(invite!.status).toBe('REVOKED')
      const oldExpiresAt = invite!.expiresAt

      // Create invite for revoked
      const response = await request(app)
        .post('/studies/1/invites')
        .send({
          recipients: [{ email: 'invite3@revoked.com', prefill: {} }],
          subjectText: 'ABC',
          explanatoryText: '123',
        })
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
        where: {
          studyId_emailHash: {
            //@ts-ignore
            email: 'invite3@revoked.com',
            studyId: 1,
          },
        },
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
        where: {
          studyId_emailHash: {
            //@ts-ignore
            email: emailPendingInvite,
            studyId: 1,
          },
        },
      })

      expect(invite).toBeDefined()

      expect(invite!.status).toBe('PENDING')
      const oldExpiresAt = invite!.expiresAt

      const response = await request(app)
        .post('/studies/1/invites')
        .send({
          recipients: [{ email: emailPendingInvite, prefill: {} }],
          subjectText: 'ABC',
          explanatoryText: '123',
        })
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
        where: {
          studyId_emailHash: {
            //@ts-ignore
            email: emailPendingInvite,
            studyId: 1,
          },
        },
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
        .post('/studies/1/invites')
        .send({
          recipients: [{ email: emailAcceptedInvite, prefill: {} }],
          subjectText: 'ABC',
          explanatoryText: '123',
        })
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      const body: InviteParticipantsResponse = response.body
      expect(response.status).toBe(200)
      expect(body.alreadyAcceptedCount).toBe(1)

      // Check email(s) were not sent
      const sentEmails = mockNodeMailer.mock.getSentMail()
      expect(sentEmails).toEqual([])

      // Check invite status was is still ACCEPTED
      const updatedInvite = await prisma.invite.findUnique({
        where: {
          studyId_emailHash: {
            //@ts-ignore
            email: emailAcceptedInvite,
            studyId: 1,
          },
        },
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
        .post('/studies/1/invites')
        .send({
          recipients: emails.map((e) => ({ email: e.email, prefill: {} })),
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
        const createdInvite = await prisma.invite.findUnique({
          where: {
            studyId_emailHash: {
              //@ts-ignore
              email: e.email,
              studyId: 1,
            },
          },
        })
        expect(createdInvite).toBeDefined()
        expect(createdInvite!.status).toBe(e.expectedStatus)
      }

      // Reset mock for other tests
      mockNodeMailer.mock.reset()
    })
  })

  describe('POST /studies/{studyId}/invites/resend', () => {
    it('should resend all invites of status PENDING and reset their expiry', async () => {
      const emailPendingInvite = 'invite1@pending.com'

      await prisma.study.update({
        where: { id: 1 },
        data: { inviteEmailSubject: 'New Subject', inviteEmailText: 'New Text' },
      })

      const response = await request(app)
        .post('/studies/1/invites/resend')
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(response.status).toBe(204)

      // Check email(s) were successfully sent
      const sentEmails = mockNodeMailer.mock.getSentMail()
      expect(sentEmails.length).toBe(4)
      const targetEmail = sentEmails.find((email) => email.to === emailPendingInvite)
      expect(targetEmail).toBeDefined()
      expect(targetEmail).toHaveProperty('from', `CTRL <noreply@${process.env.HOSTNAME}>`)
      expect(targetEmail!.subject).toBe('New Subject')
      expect(targetEmail!.html).toContain('New Text')
      expect(targetEmail!.text).toContain('New Text')
    })
  })

  describe('POST /studies/{studyId}/invites/{inviteId}/revoke', () => {
    it('should change invites status from PENDING to REVOKED given email(s)', async () => {
      const emailPendingInvite = 'invite1@pending.com'

      const invite = await prisma.invite.findUnique({
        where: {
          studyId_emailHash: {
            //@ts-ignore
            email: emailPendingInvite,
            studyId: 1,
          },
        },
      })

      expect(invite).toBeDefined()
      expect(invite!.status).toBe('PENDING')

      const response = await request(app)
        .post(`/studies/1/invites/${invite!.id}/revoke`)
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(response.status).toBe(204)

      // Check invite status was changed to REVOKED
      const updatedInvite = await prisma.invite.findUniqueOrThrow({
        where: {
          studyId_emailHash: {
            //@ts-ignore
            email: emailPendingInvite,
            studyId: 1,
          },
        },
      })
      expect(updatedInvite).toBeDefined()
      expect(updatedInvite!.status).toBe('REVOKED')
    })

    it('should return error if revoking an invite that does not exist', async () => {
      const fakeInviteId = 'notValidUuid'
      const response = await request(app)
        .post(`/studies/1/invites/${fakeInviteId}/revoke`)
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(response.status).toBe(404)
    })
  })

  describe('GET /studies/{studyId}/invites/text', () => {
    it('should return current invites text', async () => {
      await prisma.study.update({
        where: { id: 1 },
        data: { inviteEmailSubject: 'Subject', inviteEmailText: 'Text' },
      })

      const response = await request(app)
        .get('/studies/1/invites/text')
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(response.body).toStrictEqual({
        inviteEmailSubject: 'Subject',
        inviteEmailText: 'Text',
      })
    })
  })

  describe('POST /invites/{inviteId}/accept', () => {
    beforeEach(async () => {
      await inviteUser(PARTICIPANT_UNANSWERED_EMAIL, 2, {})
      await inviteUser(PARTICIPANT_COMPLETED_EMAIL, 2, {
        studyParticipant: { externalId: 'external' },
      })
    })

    it('should fail if inviteId does not exist', async () => {
      const token = await generateToken({
        userId: PARTICIPANT_UNANSWERED_ID,
        roles: ['Participant'],
      })

      const fakeIdString = 'this-is-not-real'

      const response = await request(app)
        .post(`/invites/${fakeIdString}/accept`)
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toEqual(404)

      const body = response.body
      expect(body.message).toBe('Pending invite not found')
    })

    it('should fail if invite has already been accepted', async () => {
      const invite = await prisma.invite.findFirstOrThrow({
        where: {
          email: PARTICIPANT_UNANSWERED_EMAIL,
        },
      })

      // change invite to accepted. try to accept
      await prisma.invite.update({
        where: {
          id: invite.id,
          email: PARTICIPANT_UNANSWERED_EMAIL,
        },
        data: { status: 'ACCEPTED' },
      })

      const token = await generateToken({
        userId: PARTICIPANT_UNANSWERED_ID,
        roles: ['Participant'],
      })

      const response = await request(app)
        .post(`/invites/${invite.id}/accept`)
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toEqual(404)

      const body = response.body
      expect(body.message).toBe('Pending invite not found')
    })

    it('should fail if users email does not match invite', async () => {
      // generate token for different user. use valid inviteId
      const invite = await prisma.invite.findFirstOrThrow({
        where: {
          email: PARTICIPANT_UNANSWERED_EMAIL,
        },
      })

      // Incorrect ID
      const token = await generateToken({ userId: PASSWORD_RESET_USER_ID, roles: ['Participant'] })

      const response = await request(app)
        .post(`/invites/${invite.id}/accept`)
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toEqual(404)

      const body = response.body
      expect(body.message).toBe('User does not match invite')
    })

    it('should fail if profile does not exist for user', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'usernoprofile@example.com',
          firstName: 'User',
          lastName: 'NoProfile',
          password: hashPassword('Testpassword1'),
          role: Role.Participant,
        },
      })

      const invite = await prisma.invite.create({
        data: {
          email: user.email,
          status: InviteStatus.PENDING,
          study: {
            connect: {
              id: SECOND_TEST_STUDY_ID,
            },
          },
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day in the future
        },
      })

      // Incorrect ID
      const token = await generateToken({ userId: user.id, roles: ['Participant'] })

      const response = await request(app)
        .post(`/invites/${invite.id}/accept`)
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toEqual(404)

      const body = response.body
      expect(body.message).toBe('Profile not found for user')
    })

    it('should add user to study and accept invite', async () => {
      const invite = await prisma.invite.findFirstOrThrow({
        where: {
          email: PARTICIPANT_UNANSWERED_EMAIL,
        },
      })

      // need valid invite and token for user that does exist
      const token = await generateToken({
        userId: PARTICIPANT_UNANSWERED_ID,
        roles: ['Participant'],
      })

      const response = await request(app)
        .post(`/invites/${invite.id}/accept`)
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toEqual(201)

      const p = await prisma.studyParticipant.findFirstOrThrow({
        where: {
          studyId: 2,
          participantProfile: { user: { email: PARTICIPANT_UNANSWERED_EMAIL } },
        },
      })
      expect(p.externalId).toBeNull()
    })

    it('should prefill with external id', async () => {
      const invite = await prisma.invite.findFirstOrThrow({
        where: {
          email: PARTICIPANT_COMPLETED_EMAIL,
          studyId: 2,
        },
      })

      // need valid invite and token for user that does exist
      const token = await generateToken({
        userId: PARTICIPANT_COMPLETED_ID,
        roles: ['Participant'],
      })

      const response = await request(app)
        .post(`/invites/${invite.id}/accept`)
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toEqual(201)

      const p = await prisma.studyParticipant.findFirstOrThrow({
        where: {
          studyId: 2,
          participantProfile: { user: { email: PARTICIPANT_COMPLETED_EMAIL } },
        },
      })
      expect(p.externalId).toBe('external')
    })
  })
  describe('GET /invites/pending', () => {
    beforeEach(async () => {
      await inviteUser(PARTICIPANT_UNANSWERED_EMAIL, 2, {})
    })
    it('should return correct number of invites', async () => {
      // One initial invite
      const token = await generateToken({
        userId: PARTICIPANT_UNANSWERED_ID,
        roles: ['Participant'],
      })

      const response = await request(app)
        .get(`/invites/pending`)
        .set({ Authorization: `Bearer ${token}` })
      expect(response.status).toEqual(200)

      const body = response.body
      expect(body.data.invites).toHaveLength(1)

      // zero
      // change invite to accepted.
      await prisma.invite.update({
        where: {
          studyId_emailHash: {
            //@ts-ignore
            email: PARTICIPANT_UNANSWERED_EMAIL,
            studyId: 2,
          },
        },
        data: { status: 'ACCEPTED' },
      })

      const responseZero = await request(app)
        .get(`/invites/pending`)
        .set({ Authorization: `Bearer ${token}` })
      expect(responseZero.status).toEqual(200)

      const bodyZero = responseZero.body
      expect(bodyZero.data.invites).toHaveLength(0)
    })

    // it('should return correct dependent info', async () => {
    //   await prisma.invite.create({
    //     data: {
    //       email: PARTICIPANT_COMPLETED_EMAIL,
    //       status: InviteStatus.PENDING,
    //       study: {
    //         connect: {
    //           name: SECOND_TEST_STUDY,
    //         },
    //       },
    //       expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day in the future
    //     },
    //   })

    //   // One initial invite
    //   const token = await generateToken({
    //     userId: PARTICIPANT_COMPLETED_ID,
    //     roles: ['Participant'],
    //   })

    //   const response = await request(app)
    //     .get(`/invites/pending`)
    //     .set({ Authorization: `Bearer ${token}` })
    //   expect(response.status).toEqual(200)

    //   const body = response.body
    //   expect(body.data.dependents).toHaveLength(1)
    // })

    it('should fail if user is not a participant', async () => {
      const response = await request(app)
        .get(`/invites/pending`)
        .set({ Authorization: `Bearer ${organisationAdminToken}` })

      expect(response.status).toEqual(401)
      console.log('Response:', response)
      const body = response.body
      expect(body.message).toBe('Incorrect Permissions')
    })
  })

  describe('GET /invites/:inviteId/prefill', () => {
    let inviteId: string

    beforeEach(async () => {
      // Create an invite with prefill data
      const invite = await prisma.invite.create({
        data: {
          email: 'prefilltest@example.com',
          status: InviteStatus.PENDING,
          studyId: 1,
          prefill: JSON.stringify({
            profile: { firstName: 'Jane', lastName: 'Doe' },
            studyParticipant: {
              externalId: 'REDCAPIMPORT123',
            },
          }),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })
      inviteId = invite.id
    })

    it('should return prefill data for a valid invite', async () => {
      const response = await request(app).get(`/invites/${inviteId}/prefill`)
      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        profile: { firstName: 'Jane', lastName: 'Doe' },
        studyParticipant: {
          externalId: 'REDCAPIMPORT123',
        },
      })
    })

    it('should return 404 for a non-existent invite', async () => {
      const fakeId = 'not-a-real-id'
      const response = await request(app).get(`/invites/${fakeId}/prefill`)
      expect(response.status).toBe(404)
    })

    it('should return prefill as an empty object if not set', async () => {
      const invite = await prisma.invite.create({
        data: {
          email: 'noprefill@example.com',
          status: InviteStatus.PENDING,
          studyId: 1,
          prefill: JSON.stringify({}),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })
      const response = await request(app).get(`/invites/${invite.id}/prefill`)
      expect(response.status).toBe(200)
      expect(response.body).toEqual({})
    })
  })
})
