import prisma from '../PrismaClient'
import { resetDB } from 'common/testing/TestHelpers'
import createAdmin from './createAdmin'

describe('Test create admin script', () => {
  beforeAll(async () => {
    await resetDB()
  })

  it('Does not create admin user if not specified in env file', async () => {
    process.env['ORG_ADMIN_EMAIL'] = ''
    await createAdmin()
    const admin_users = await prisma.user.findMany({ where: { role: 'OrganisationAdmin' } })
    expect(admin_users).toHaveLength(2)
  })
  it('Creates admin user if specified in env file', async () => {
    process.env['ORG_ADMIN_EMAIL'] = 'admin@test.com'
    process.env['ORG_ADMIN_PASSWORD'] = 'Ap9!hK2vBmN4qXr7'
    await createAdmin()
    const admin_users = await prisma.user.findMany({ where: { role: 'OrganisationAdmin' } })
    expect(admin_users).toHaveLength(3)
  })
  it('Throws if ORG_ADMIN_PASSWORD contains part of ORG_ADMIN_EMAIL', async () => {
    process.env['ORG_ADMIN_EMAIL'] = 'marigold.admin@test.com'
    // Passes every other rule, so only the email check can reject it
    process.env['ORG_ADMIN_PASSWORD'] = 'Marigold2026Strong'
    await expect(createAdmin()).rejects.toThrow('ORG_ADMIN_PASSWORD does not meet strength policy')
    const admin_users = await prisma.user.findMany({ where: { role: 'OrganisationAdmin' } })
    expect(admin_users).toHaveLength(3)
  })
  it('Throws if ORG_ADMIN_PASSWORD does not meet strength policy', async () => {
    process.env['ORG_ADMIN_EMAIL'] = 'weak-admin@test.com'
    process.env['ORG_ADMIN_PASSWORD'] = 'tespassword'
    await expect(createAdmin()).rejects.toThrow('ORG_ADMIN_PASSWORD does not meet strength policy')
  })
})
