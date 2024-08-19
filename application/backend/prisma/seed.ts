import { PrismaClient } from './generated/client'
import * as users from './seedUserData.json'

// Setup Database URL
const { POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_PORT, POSTGRES_DB } = process.env

if (!POSTGRES_HOST || !POSTGRES_USER || !POSTGRES_PASSWORD || !POSTGRES_PORT || !POSTGRES_DB) {
  throw new Error('Missing required environment variables for PostgreSQL.')
}

const databaseUrl: string = `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`

process.env.DATABASE_URL = databaseUrl

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
