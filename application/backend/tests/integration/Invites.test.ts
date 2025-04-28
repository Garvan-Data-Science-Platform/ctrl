import request from 'supertest'
import { Api } from '../../src/Api'
import { resetDB } from 'common/testing/TestHelpers'
import {
  ContactMethod,
  ParticipantType,
  StateTerritory,
} from 'common/types/api/users/ParticipantProfile'
import { InviteStatus, Role } from '@prisma/client'
import { NodemailerMock } from 'nodemailer-mock'
import * as nodemailer from 'nodemailer'
import { generateToken } from '../../src/authentication'
import { RegisterParticipantRequest } from 'common/types/api/auth'
import { GetInvitesResponse, InviteParticipantsResponse } from 'common/types/api/participants'
import prisma from '../../src/PrismaClient'
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
    password: 'Password123',
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
    orgAdminToken = await generateToken({ userId: 97, roles: [Role.OrganisationAdmin] })
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
    const response = await request(app)
      .post('/auth/register/participant')
      .send(participantRegisterRequestBody)
    expect(response.status).toBe(404)
    expect(response.body.message).toBe(
      `Invite for ${participantRegisterRequestBody.email} not found`,
    )
  })

  it('should allow an OrganisationAdmin user to create and send invites to new participants', async () => {
    // Create an invite
    const response = await request(app)
      .post('/invites')
      .send({
        emails: [participantRegisterRequestBody.email],
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
      where: { email: participantRegisterRequestBody.email },
    })

    expect(createdInvite).toBeDefined()
    // See link about non-null assertion operator https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-0.html#non-null-assertion-operator
    expect(createdInvite!.status).toBe('PENDING')
  })

  it('should allow an OrganisationAdmin user to resend invites with status PENDING', async () => {
    // Send a new invite
    const response = await request(app)
      .post('/invites')
      .send({
        emails: [participantRegisterRequestBody.email],
        subjectText: 'Subject',
        explanatoryText: 'Text',
      })
      .set({ Authorization: `Bearer ${orgAdminToken}` })
    expect(response.status).toBe(200)

    // Reset mailer to clear intial invite email
    mockNodeMailer.mock.reset()

    // get number of PENDING invites from seed to avoid hardcoding
    const pendingResponse = await request(app)
      .get('/invites')
      .set({ Authorization: `Bearer ${orgAdminToken}` })
    expect(pendingResponse.status).toBe(200)

    const body: GetInvitesResponse = pendingResponse.body

    const pendingCount = body.data.filter(
      (invite) => invite.inviteStatus === InviteStatus.PENDING,
    ).length

    // Resend invites ()
    const resendResponse = await request(app)
      .post(`/invites/resend`)
      .set({ Authorization: `Bearer ${orgAdminToken}` })
    expect(resendResponse.status).toBe(204)

    // Check emails were successfully sent again
    const sentEmails = mockNodeMailer.mock.getSentMail()
    expect(sentEmails.length).toBe(pendingCount)
    // adjust count to be used as index
    expect(sentEmails[pendingCount - 1].to).toBe(participantRegisterRequestBody.email)
    // adjust count to be used as index
    expect(sentEmails[pendingCount - 1].from).toBe(`CTRL <noreply@${process.env.HOSTNAME}>`)
  })

  it('should allow an OrganisationAdmin user to REVOKE invites to participants with status PENDING', async () => {
    // Send a new invite
    const response = await request(app)
      .post('/invites')
      .send({
        emails: [participantRegisterRequestBody.email],
        subjectText: 'Subject',
        explanatoryText: 'Text',
      })
      .set({ Authorization: `Bearer ${orgAdminToken}` })

    const body: InviteParticipantsResponse = response.body
    expect(response.status).toBe(200)
    expect(body.newInvitesCount).toBe(1)

    // Check the invite exists
    const invite = await prisma.invite.findUnique({
      where: { email: participantRegisterRequestBody.email },
    })

    expect(invite).toBeDefined()
    expect(invite!.status).toBe('PENDING')

    // Revoke an invite
    const revokedResponse = await request(app)
      .post(`/invites/revoke/${invite!.id}`)
      .set({ Authorization: `Bearer ${orgAdminToken}` })

    expect(revokedResponse.status).toBe(204)

    // Check invite was revoked
    const revokedInvite = await prisma.invite.findUnique({
      where: { email: participantRegisterRequestBody.email },
    })

    expect(revokedInvite?.status).toBe('REVOKED')
  })

  it('should not allow participants to register using an EXPIRED or REVOKED invite', async () => {
    // Register a participant with a revoked invite
    const response2 = await request(app)
      .post('/auth/register/participant')
      .send(participantRegisterRequestBody)

    expect(response2.status).toBe(404)
    expect(response2.body.message).toBe(
      `Invite for ${participantRegisterRequestBody.email} not found`,
    )

    // Register a participant with an expired invite
    participantRegisterRequestBody.email = 'invite4@expired.com'
    const response = await request(app)
      .post('/auth/register/participant')
      .send(participantRegisterRequestBody)

    expect(response.status).toBe(404)
    expect(response.body.message).toBe(
      `Invite for ${participantRegisterRequestBody.email} not found`,
    )
  })

  it('should allow participants to register using a PENDING invite', async () => {
    // Send a new invite
    const response = await request(app)
      .post('/invites')
      .send({
        emails: [participantRegisterRequestBody.email],
        subjectText: 'Subject',
        explanatoryText: 'Text',
      })
      .set({ Authorization: `Bearer ${orgAdminToken}` })
    const body: InviteParticipantsResponse = response.body
    expect(response.status).toBe(200)

    expect(body.resendEmailRequestCount).toBe(1)

    // Check the invite exists
    const invite = await prisma.invite.findUnique({
      where: { email: participantRegisterRequestBody.email },
    })

    expect(invite).toBeDefined()
    expect(invite!.status).toBe('PENDING')
    // Register a participant with an invite
    const registerResponse = await request(app)
      .post('/auth/register/participant')
      .send(participantRegisterRequestBody)

    expect(registerResponse.status).toBe(201)
    expect(registerResponse.body.token).not.toBe(undefined)
  })
})
