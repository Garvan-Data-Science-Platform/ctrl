import request from 'supertest'
import { Api } from '../../src/Api'
import { resetDB } from 'common/testing/TestHelpers'
import {
  ContactMethod,
  ParticipantType,
  StateTerritory,
} from 'common/types/api/users/ParticipantProfile'
import { InviteStatus } from '@prisma/client'
import { NodemailerMock } from 'nodemailer-mock'
import * as nodemailer from 'nodemailer'
import { generateToken } from '../../src/authentication'
import { RegisterParticipantRequest } from 'common/types/api/auth'
import { GetInvitesResponse, InviteParticipantsResponse } from 'common/types/api/participants'
import prisma from '../../src/PrismaClient'
import { TestUsers } from 'common/testing/constants'

import config from '../../src/config'
jest.mock('../../src/config')

const mockNodeMailer = nodemailer as unknown as NodemailerMock

const api = new Api()
const app = api.app

describe('Participant Invites', () => {
  let orgAdminToken: string

  const participantRegisterRequestBody: RegisterParticipantRequest = {
    firstName: 'John',
    middleName: 'James',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    password: TestUsers.PARTICIPANT_COMPLETED.password, // Note: using test users pw to match requirements
    dob: '2000-05-21',
    mobile: '0412341234',
    addressLine: '123 Sydney Street',
    suburb: 'Sydney',
    postcode: '2000',
    state: StateTerritory.NSW,
    participantType: ParticipantType.STANDARD,
    preferredContact: ContactMethod.MOBILE,
    nextOfKin: {
      firstName: 'Jeremy',
      middleName: 'Jimmy',
      lastName: 'Doe',
      mobile: '0412341432',
      email: 'jeremydoe@email.com',
    },
    dependents: [],
  }

  beforeAll(async () => {
    api.run()
    orgAdminToken = await generateToken({ userId: TestUsers.ORG_ADMIN.id })
    await resetDB()
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

  it('should not allow participants to register without an invite', async () => {
    // Register a participant without an invite
    const missingInviteId = 'notValid'

    const response = await request(app)
      .post(`/auth/register/participants/${missingInviteId}`)
      .send(participantRegisterRequestBody)
    expect(response.status).toBe(404)
    expect(response.body.message).toBe(
      `Invite for ${participantRegisterRequestBody.email} not found`,
    )
  })

  it('should allow an OrganisationAdmin user to create and send invites to new participants', async () => {
    // Create an invite
    const response = await request(app)
      .post('/studies/1/invites')
      .send({
        recipients: [{ prefill: {}, email: participantRegisterRequestBody.email }],
        subjectText: 'Subject',
        explanatoryText: 'Text',
      })
      .set({ Authorization: `Bearer ${orgAdminToken}` })
    const body: InviteParticipantsResponse = response.body
    expect(response.status).toBe(200)
    expect(body.newInvitesCount).toBe(1)

    // Check emails were successfully sent
    const sentEmails = mockNodeMailer.mock.getSentMail()
    expect(sentEmails.length).toBe(1)
    expect(sentEmails[0].to).toBe(participantRegisterRequestBody.email)
    expect(sentEmails[0].from).toBe(`CTRL <noreply@${process.env.HOSTNAME}>`)

    // Check invites were created
    const createdInvite = await prisma.invite.findUnique({
      where: {
        studyId_emailHash: {
          email: participantRegisterRequestBody.email,
          studyId: 1,
        },
      },
    })

    expect(createdInvite).toBeDefined()
    // See link about non-null assertion operator https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-0.html#non-null-assertion-operator
    expect(createdInvite!.status).toBe('PENDING')
  })

  it('should allow an OrganisationAdmin user to resend invites with status PENDING', async () => {
    // Send a new invite
    const response = await request(app)
      .post('/studies/1/invites')
      .send({
        recipients: [{ prefill: {}, email: participantRegisterRequestBody.email }],
        subjectText: 'Subject',
        explanatoryText: 'Text',
      })
      .set({ Authorization: `Bearer ${orgAdminToken}` })
    expect(response.status).toBe(200)

    // Reset mailer to clear intial invite email
    mockNodeMailer.mock.reset()

    // get number of PENDING invites from seed to avoid hardcoding
    const pendingResponse = await request(app)
      .get('/studies/1/invites')
      .set({ Authorization: `Bearer ${orgAdminToken}` })
    expect(pendingResponse.status).toBe(200)

    const body: GetInvitesResponse = pendingResponse.body

    const pendingCount = body.data.filter(
      (invite) => invite.inviteStatus === InviteStatus.PENDING,
    ).length

    const sentEmails0 = mockNodeMailer.mock.getSentMail()

    // Check if participant email is in the sent emails
    const sentEmail0 = sentEmails0.find(
      (email) => email.to === participantRegisterRequestBody.email,
    )

    expect(sentEmail0).toBeUndefined()

    // Resend invites ()
    const resendResponse = await request(app)
      .post(`/studies/1/invites/resend`)
      .set({ Authorization: `Bearer ${orgAdminToken}` })
    expect(resendResponse.status).toBe(204)

    // Check emails were successfully sent again
    const sentEmails1 = mockNodeMailer.mock.getSentMail()
    expect(sentEmails1.length).toBe(pendingCount)

    // Check if participant email is in the sent emails
    const sentEmail1 = sentEmails1.find(
      (email) => email.to === participantRegisterRequestBody.email,
    )

    expect(sentEmail1?.to).toBe(participantRegisterRequestBody.email)
    expect(sentEmail1?.from).toBe(`CTRL <noreply@${process.env.HOSTNAME}>`)
    expect(sentEmail1?.subject).toBe('Subject')
    expect(sentEmail1?.text).toContain('Text')
  })

  it('should allow an OrganisationAdmin user to REVOKE invites to participants with status PENDING', async () => {
    // Send a new invite
    const response = await request(app)
      .post('/studies/1/invites')
      .send({
        recipients: [{ prefill: {}, email: participantRegisterRequestBody.email }],
        subjectText: 'Subject',
        explanatoryText: 'Text',
      })
      .set({ Authorization: `Bearer ${orgAdminToken}` })

    const body: InviteParticipantsResponse = response.body
    expect(response.status).toBe(200)
    expect(body.newInvitesCount).toBe(1)

    // Check the invite exists
    const invite = await prisma.invite.findUnique({
      where: {
        studyId_emailHash: {
          email: participantRegisterRequestBody.email,
          studyId: 1,
        },
      },
    })

    expect(invite).toBeDefined()
    expect(invite!.status).toBe('PENDING')

    // Revoke an invite
    const revokedResponse = await request(app)
      .post(`/studies/1/invites/${invite!.id}/revoke`)
      .set({ Authorization: `Bearer ${orgAdminToken}` })

    expect(revokedResponse.status).toBe(204)

    // Check invite was revoked
    const revokedInvite = await prisma.invite.findUnique({
      where: {
        studyId_emailHash: {
          email: participantRegisterRequestBody.email,
          studyId: 1,
        },
      },
    })

    expect(revokedInvite?.status).toBe('REVOKED')
  })

  it('should not allow participants to register using a REVOKED invite', async () => {
    // Send a new invite
    const responseToBeRevoked = await request(app)
      .post('/studies/1/invites')
      .send({
        recipients: [{ prefill: {}, email: participantRegisterRequestBody.email }],
        subjectText: 'Subject',
        explanatoryText: 'Text',
      })
      .set({ Authorization: `Bearer ${orgAdminToken}` })

    const body: InviteParticipantsResponse = responseToBeRevoked.body
    expect(responseToBeRevoked.status).toBe(200)
    expect(body.newInvitesCount).toBe(1)

    // Check the invite exists
    const invite = await prisma.invite.findUnique({
      where: {
        studyId_emailHash: {
          email: participantRegisterRequestBody.email,
          studyId: 1,
        },
      },
    })

    expect(invite).toBeDefined()
    expect(invite!.status).toBe('PENDING')

    // Revoke an invite
    const revokedResponse = await request(app)
      .post(`/studies/1/invites/${invite!.id}/revoke`)
      .set({ Authorization: `Bearer ${orgAdminToken}` })

    expect(revokedResponse.status).toBe(204)

    // Confirm it is revoked
    const inviteRevoked = await prisma.invite.findUnique({
      where: {
        studyId_emailHash: {
          email: participantRegisterRequestBody.email,
          studyId: 1,
        },
      },
    })

    expect(inviteRevoked).toBeDefined()
    expect(inviteRevoked!.status).toBe('REVOKED')

    // Register a participant with a revoked invite
    const response = await request(app)
      .post(`/auth/register/participants/${inviteRevoked!.id}`)
      .send(participantRegisterRequestBody)

    expect(response.status).toBe(404)
    expect(response.body.message).toBe(
      `Invite for ${participantRegisterRequestBody.email} not found`,
    )
  })

  it('should not allow participants to register using an EXPIRED invite', async () => {
    // Send a new invite
    const responseToBeExpired = await request(app)
      .post('/studies/1/invites')
      .send({
        recipients: [{ prefill: {}, email: participantRegisterRequestBody.email }],
        subjectText: 'Subject',
        explanatoryText: 'Text',
      })
      .set({ Authorization: `Bearer ${orgAdminToken}` })

    const body: InviteParticipantsResponse = responseToBeExpired.body
    expect(responseToBeExpired.status).toBe(200)
    expect(body.newInvitesCount).toBe(1)

    // Check the invite exists
    const invite = await prisma.invite.findUnique({
      where: {
        studyId_emailHash: {
          email: participantRegisterRequestBody.email,
          studyId: 1,
        },
      },
    })

    expect(invite).toBeDefined()
    expect(invite!.status).toBe('PENDING')

    // Set to be expired
    await prisma.invite.update({
      where: { id: invite!.id },
      data: {
        status: 'EXPIRED',
      },
    })

    // Confirm it is expired
    const inviteExpired = await prisma.invite.findUnique({
      where: {
        studyId_emailHash: {
          email: participantRegisterRequestBody.email,
          studyId: 1,
        },
      },
    })

    expect(inviteExpired).toBeDefined()
    expect(inviteExpired!.status).toBe('EXPIRED')

    const response = await request(app)
      .post(`/auth/register/participants/${inviteExpired!.id}`)
      .send(participantRegisterRequestBody)

    expect(response.status).toBe(404)
    expect(response.body.message).toBe(
      `Invite for ${participantRegisterRequestBody.email} not found`,
    )
  })

  it('should allow participants to register using a PENDING invite', async () => {
    // Send a new invite
    const response = await request(app)
      .post('/studies/1/invites')
      .send({
        recipients: [
          {
            prefill: { studyParticipant: { externalId: 'abc123' } },
            email: participantRegisterRequestBody.email,
          },
        ],
        subjectText: 'Subject',
        explanatoryText: 'Text',
      })
      .set({ Authorization: `Bearer ${orgAdminToken}` })
    const body: InviteParticipantsResponse = response.body
    expect(response.status).toBe(200)

    expect(body.resendEmailRequestCount).toBe(1)

    // Check the invite exists
    const invite = await prisma.invite.findUnique({
      where: {
        studyId_emailHash: {
          email: participantRegisterRequestBody.email,
          studyId: 1,
        },
      },
    })

    expect(invite).toBeDefined()
    expect(invite!.status).toBe('PENDING')
    // Register a participant with an invite
    const registerResponse = await request(app)
      .post(`/auth/register/participants/${invite!.id}`)
      .send(participantRegisterRequestBody)

    expect(registerResponse.status).toBe(201)
    expect(registerResponse.body.token).not.toBe(undefined)

    const count = await prisma.studyParticipant.count({ where: { externalId: 'abc123' } })
    expect(count).toEqual(1)
  })

  // Invite expiry should be configurable
  it('should allow configuring invite expiry duration', async () => {
    const sendInviteResponse = await request(app)
      .post('/studies/1/invites')
      .send({
        recipients: [{ prefill: {}, email: participantRegisterRequestBody.email }],
        subjectText: 'Subject',
        explanatoryText: 'Text',
      })
      .set({ Authorization: `Bearer ${orgAdminToken}` })
    expect(sendInviteResponse.status).toBe(200)
    console.log(sendInviteResponse.body)

    // Check the invite expiry
    const invite = await prisma.invite.findUnique({
      where: {
        studyId_emailHash: {
          email: participantRegisterRequestBody.email,
          studyId: 1,
        },
      },
    })

    expect(invite).toBeDefined()
    expect(invite!.status).toBe('PENDING')
    // should be 7 days from the mocked config
    const createdAt = new Date(invite!.createdAt)
    const expiresAt = new Date(invite!.expiresAt)
    const diffMs = expiresAt.getTime() - createdAt.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(7)

    jest.replaceProperty(config, 'inviteExpiryDays', 1) // 1 day expiry
    console.log(config)
    // Send another invite
    const sendInviteResponse2 = await request(app)
      .post('/studies/1/invites')
      .send({
        recipients: [{ prefill: {}, email: 'somenew@email.com' }],
        subjectText: 'Subject',
        explanatoryText: 'Text',
      })
      .set({ Authorization: `Bearer ${orgAdminToken}` })
    expect(sendInviteResponse2.status).toBe(200)

    // Check the invite expiry
    const invite2 = await prisma.invite.findUnique({
      where: {
        studyId_emailHash: {
          email: 'somenew@email.com',
          studyId: 1,
        },
      },
    })

    expect(invite2).toBeDefined()
    expect(invite2!.status).toBe('PENDING')
    // should be 1 day from the mocked config
    const createdAt2 = new Date(invite2!.createdAt)
    const expiresAt2 = new Date(invite2!.expiresAt)
    const diffMs2 = expiresAt2.getTime() - createdAt2.getTime()
    const diffDays2 = Math.round(diffMs2 / (1000 * 60 * 60 * 24))
    expect(diffDays2).toBe(1)
  })
})
