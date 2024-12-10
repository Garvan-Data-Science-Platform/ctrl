import { hashPassword } from '../authentication'
import prisma from '../PrismaClient'

const createAdmin = async () => {
  if (process.env['ADMIN_PASSWORD'] && process.env['ADMIN_EMAIL']) {
    const admin = await prisma.user.findFirst({ where: { email: process.env['ADMIN_EMAIL'] } })
    if (!admin) {
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
}

export default createAdmin
