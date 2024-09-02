import { PrismaClient, User } from '../generated/client'
import * as data from './seedUserData.json'

const prisma = new PrismaClient()

const main = async () => {
  const { users, organisations } = data

  // Create organisations
  const createdOrganisations = await prisma.organisation.createMany({
    data: organisations.map((org) => ({
      name: org.name,
    })),
    skipDuplicates: true, // Skip duplicates if any
  })

  console.log(`Added ${createdOrganisations.count} organisations`)

  // Create a map of organisation names to their ID
  const savedOrganisations = await prisma.organisation.findMany({
    where: { name: { in: organisations.map((o) => o.name) } },
    select: { id: true, name: true },
  })

  const savedUsers = await Promise.all(
    users.map(async (user) => {
      return await prisma.user.create({
        data: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          organisations: {
            connect: user.organisations
              .map((orgName) => savedOrganisations.find((org) => org.name === orgName)?.id)
              .map((id) => ({ id: id! })),
          },
        },
      })
    }),
  )
  console.log('Added the following users:', savedUsers)
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
