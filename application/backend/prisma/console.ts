// Set up a REPL for Prisma
// Prisma client is available as `prisma`

import prisma from '../src/PrismaClient'

//@ts-ignore
globalThis.prisma = prisma
