import { hashPassword } from '../authentication'
import prisma from '../PrismaClient'

const createAdmin = async () => {
  const admin = await prisma.user.findFirst({ where: { email: process.env['ADMIN_EMAIL'] } })

  if (!admin && process.env['ADMIN_PASSWORD'] && process.env['ADMIN_EMAIL']) {
    await prisma.user.create({
      data: {
        email: process.env['ADMIN_EMAIL'] as string,
        firstName: 'ADMIN',
        lastName: 'USER',
        password: await hashPassword(process.env['ADMIN_PASSWORD']),
        role: 'OrganisationAdmin',
      },
    })
  }
}

export default createAdmin
