/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
  clearMocks: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@common/(.*)$': '<rootDir>/../common/$1',
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  reporters:
    process.env.GITHUB_ACTIONS === 'true'
      ? ['github-actions', { silent: false }, 'summary']
      : [['default', { summaryThreshold: 10 }]],
}
