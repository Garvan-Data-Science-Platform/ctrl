/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  clearMocks: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./src/PrismaClientMock.ts'],
  moduleNameMapper: {
    '^@common/(.*)$': '<rootDir>/../common/$1',
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
}
