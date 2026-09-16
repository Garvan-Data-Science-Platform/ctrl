import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'
import prisma from './PrismaClient'
import { resetDB } from 'common/testing/TestHelpers'
import { TestStudies } from 'common/testing/constants'

const saltedHash = (input: string, saltEnvName: string): string => {
  const salt = process.env[saltEnvName]
  if (!salt) throw new Error(`${saltEnvName} not set`)
  return createHash('sha256').update(input).update(salt).digest('hex')
}

// Catches a future dev dropping ?saltEnv= from a schema.prisma annotation
// or misconfiguring which salt env var applies to which field
describe('PrismaClient blind-index salting', () => {
  const raw = new PrismaClient()

  beforeAll(async () => {
    await resetDB()
  })

  afterAll(async () => {
    await raw.$disconnect()
  })

  it('User.emailHash uses EMAIL_HASH_SALT', async () => {
    const email = `salt-check-user-${Date.now()}@example.com`
    const created = await prisma.user.create({
      data: { email, firstName: 'x', lastName: 'y', password: 'p' },
    })
    const row = await raw.user.findUniqueOrThrow({
      where: { id: created.id },
      select: { emailHash: true },
    })
    expect(row.emailHash).toEqual(saltedHash(email, 'EMAIL_HASH_SALT'))
    expect(row.emailHash).not.toEqual(createHash('sha256').update(email).digest('hex'))
  })

  it('ParticipantProfile firstName/lastName/dob use their per-field salts', async () => {
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
    expect(row.firstNameHash).toEqual(saltedHash(firstName, 'FIRST_NAME_HASH_SALT'))
    expect(row.lastNameHash).toEqual(saltedHash(lastName, 'LAST_NAME_HASH_SALT'))
    expect(row.dobHash).toEqual(saltedHash(dob, 'DOB_HASH_SALT'))
  })

  it('Invite.emailHash uses EMAIL_HASH_SALT (shared with User)', async () => {
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
    expect(row.emailHash).toEqual(saltedHash(email, 'EMAIL_HASH_SALT'))
  })

  it('per-field salts are distinct: same input hashes differently across field types', async () => {
    const shared = `same-input-${Date.now()}`
    expect(saltedHash(shared, 'EMAIL_HASH_SALT')).not.toEqual(
      saltedHash(shared, 'FIRST_NAME_HASH_SALT'),
    )
    expect(saltedHash(shared, 'FIRST_NAME_HASH_SALT')).not.toEqual(
      saltedHash(shared, 'LAST_NAME_HASH_SALT'),
    )
    expect(saltedHash(shared, 'LAST_NAME_HASH_SALT')).not.toEqual(
      saltedHash(shared, 'DOB_HASH_SALT'),
    )
  })
})
