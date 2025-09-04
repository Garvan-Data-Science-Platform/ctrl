// Set up a REPL for Prisma
// Prisma client is available as `prisma`

import { PrismaClient } from '@prisma/client'

// Note: this doesn't use `application/backend/src/PrismaClient.ts` with middleware...
const prisma = new PrismaClient()

globalThis.prisma = prisma
