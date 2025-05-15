/** @type {import('ts-jest').JestConfigWithTsJest} */

export default {
  clearMocks: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@common/(.*)$': '<rootDir>/../common/$1',
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  reporters:
    process.env.GITHUB_ACTIONS === 'true'
      ? [['github-actions', { silent: false }], 'summary']
      : [['default', { summaryThreshold: 10 }]],
}
