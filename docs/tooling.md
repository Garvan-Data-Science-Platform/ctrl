# Tooling documentation

The following is a list of technologies and tools used in this repository, with some explanation of why they were chosen.

- [Development environment](#development-environment)
  - [Node.js](#node.js)
  - [nvm](#nvm)
  - [Yarn](#yarn)
  - [TypeScript](#typescript)
- [Validation and testing](#validation-and-testing)
  - [Pre-commit checks](#pre-commit-checks)
- [CI/CD](#ci/cd)
- [Containerisation](#containerisation)

### Development environment

#### Node.js

[Node.js](https://nodejs.org) provides a JavaScript runtime environment.

#### Node Version Manager (nvm)

We recommend using [nvm](https://github.com/nvm-sh/nvm) for node version management.
There is an `.nvmrc` in this repository to specify which version of node to use.

#### Yarn

Rationale to come

#### TypeScript

The main application is written in TypeScript, a strongly typed version of JavaScript

### Validation and testing

#### Pre-commit checks

The code in the repo is formatted by [Prettier](https://prettier.io/) and validated (via static analysis) by [ESLint](https://eslint.org/).
Formatting and linting checks are run during pre-commit checks (and also in CI).
In addition, the staged code is scanned for private-keys.

You will need to [install pre-commit](https://pre-commit.com/#install) on your system, then run `pre-commit install` once within the repo to initialise the git hook.
You can then run `pre-commit run` within the repo to run the checks.
The pre-commit checks will also run each time you run `git commit`.

### CI/CD

Details to come

### Containerisation

Details to come
