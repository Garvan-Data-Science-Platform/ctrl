import { PrismaClient } from '../prisma/generated/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

import prisma from './PrismaClient'

jest.mock('./PrismaClient', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}))

beforeEach(() => {
  mockReset(PrismaMock)
})

export const PrismaMock = prisma as unknown as DeepMockProxy<PrismaClient>
