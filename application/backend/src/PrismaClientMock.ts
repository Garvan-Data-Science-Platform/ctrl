import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

import prisma from './PrismaClient'

jest.mock('./PrismaClient', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}))

beforeEach(() => {
  mockReset(PrismaClientMock)
})

export const PrismaClientMock = prisma as unknown as DeepMockProxy<PrismaClient>
