import { checkPasswordStrength } from 'common/src/PasswordStrength'
import { hashPassword } from '../authentication'
import prisma from '../PrismaClient'

const createAdmin = async () => {
  const admin = await prisma.user.findFirst({ where: { email: process.env['ORG_ADMIN_EMAIL'] } })

  if (!admin && process.env['ORG_ADMIN_PASSWORD'] && process.env['ORG_ADMIN_EMAIL']) {
    const { isValid, fields } = checkPasswordStrength(process.env['ORG_ADMIN_PASSWORD'] as string)
    if (!isValid) {
      const reasons = Object.values(fields)
        .map((f) => f.message)
        .join(', ')
      throw new Error(`ORG_ADMIN_PASSWORD does not meet strength policy: ${reasons}`)
    }
    await prisma.user.create({
      data: {
        email: process.env['ORG_ADMIN_EMAIL'] as string,
        firstName: 'ORG_ADMIN',
        lastName: 'USER',
        password: await hashPassword(process.env['ORG_ADMIN_PASSWORD']),
        role: 'OrganisationAdmin',
      },
    })
  }
}

export default createAdmin
