import { hashPassword } from '../authentication'
import prisma from '../PrismaClient'

const createAdmin = async () => {
  const email = (process.env['ORG_ADMIN_EMAIL'] ?? '').trim()
  const password = (process.env['ORG_ADMIN_PASSWORD'] ?? '').trim()
  const admin = await prisma.user.findFirst({ where: { email } })

  if (!admin && password && email) {
    await prisma.user.create({
      data: {
        email,
        firstName: 'ORG_ADMIN',
        lastName: 'USER',
        password: await hashPassword(password),
        role: 'OrganisationAdmin',
      },
    })
  }
}

export default createAdmin
