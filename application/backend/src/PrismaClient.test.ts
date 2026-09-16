import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'
import prisma from './PrismaClient'
import { resetDB } from 'common/testing/TestHelpers'
import { TestStudies } from 'common/testing/constants'

// Catches a future dev dropping ?saltEnv= from a schema.prisma annotation
describe('PrismaClient blind-index salting', () => {
  const raw = new PrismaClient()

  beforeAll(async () => {
    await resetDB()
  })

  afterAll(async () => {
    await raw.$disconnect()
  })

  it('User.emailHash is salted, not plain sha256(email)', async () => {
    const email = `salt-check-user-${Date.now()}@example.com`
    const created = await prisma.user.create({
      data: { email, firstName: 'x', lastName: 'y', password: 'p' },
    })
    const row = await raw.user.findUniqueOrThrow({
      where: { id: created.id },
      select: { emailHash: true },
    })
    expect(row.emailHash).not.toBeNull()
    expect(row.emailHash).not.toEqual(createHash('sha256').update(email).digest('hex'))
  })

  it('ParticipantProfile firstNameHash / lastNameHash / dobHash are salted', async () => {
    const stamp = Date.now()
    const firstName = `salt-first-${stamp}`
    const lastName = `salt-last-${stamp}`
    const dob = '1990-01-01'
    const created = await prisma.participantProfile.create({
      data: {
        firstName,
        lastName,
        dob,
        mobile: '0400000000',
        addressLine: '1 Test St',
        suburb: 'Testville',
        state: 'NSW',
        postcode: '2000',
        participantType: 'STANDARD',
        preferredContact: 'EMAIL',
      },
    })
    const row = await raw.participantProfile.findUniqueOrThrow({
      where: { id: created.id },
      select: { firstNameHash: true, lastNameHash: true, dobHash: true },
    })
    expect(row.firstNameHash).not.toEqual(createHash('sha256').update(firstName).digest('hex'))
    expect(row.lastNameHash).not.toEqual(createHash('sha256').update(lastName).digest('hex'))
    expect(row.dobHash).not.toEqual(createHash('sha256').update(dob).digest('hex'))
  })

  it('Invite.emailHash is salted, not plain sha256(email)', async () => {
    const email = `salt-check-invite-${Date.now()}@example.com`
    const created = await prisma.invite.create({
      data: {
        email,
        studyId: TestStudies.TEST_STUDY.id,
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    })
    const row = await raw.invite.findUniqueOrThrow({
      where: { id: created.id },
      select: { emailHash: true },
    })
    expect(row.emailHash).not.toBeNull()
    expect(row.emailHash).not.toEqual(createHash('sha256').update(email).digest('hex'))
  })
})
