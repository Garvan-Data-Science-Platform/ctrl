import { PrismaClient } from './generated/client'
import * as users from './seedUserData.json'

const prisma = new PrismaClient()

const main = async () => {
  users.map(async (user) => {
    await prisma.user
      .upsert({
        where: { email: user.email },
        create: user,
        update: user,
      })
      .then((result) => {
        console.log(result)
      })
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
