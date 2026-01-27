/* eslint-env node */

module.exports = {
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/ban-ts-comment': 'off',
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@refinedev/core',
            importNames: ['useLogin'],
            message: 'Please use the type-safe "useLogin" from "src/hooks/useLogin" instead.',
          },
        ],
      },
    ],
  },
}
