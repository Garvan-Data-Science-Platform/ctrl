# Tooling documentation

The following is a list of technologies and tools used in this repository, with some explanation of why they were chosen.

- [Tooling documentation](#tooling-documentation)
    - [Development environment](#development-environment)
      - [Node.js](#nodejs)
      - [Node Version Manager (nvm)](#node-version-manager-nvm)
      - [Yarn](#yarn)
      - [TypeScript](#typescript)
    - [Validation and testing](#validation-and-testing)
      - [Pre-commit checks](#pre-commit-checks)
    - [CI/CD](#cicd)

### Development environment

#### Node.js

[Node.js](https://nodejs.org) provides a JavaScript runtime environment.

#### Node Version Manager (nvm)

We recommend using [nvm](https://github.com/nvm-sh/nvm) for node version management.
There is an `.nvmrc` in this repository to specify which version of node to use.

#### Yarn

Yarn is used as the package manager for this repository because it offers faster and more reliable dependency installations compared to npm. Yarn also provides better support for monorepos and workspaces, which is useful for managing the multiple packages within this project.

#### TypeScript

The main application is written in TypeScript, a strongly typed version of JavaScript

### Validation and testing

#### Pre-commit checks

The code in the repo is formatted by [Prettier](https://prettier.io/) and validated (via static analysis) by [ESLint](https://eslint.org/).
Formatting and linting checks are run during pre-commit checks (and also in CI).
The pre-commit checks will run each time you run `git commit`.

### CI/CD

Continuous Integration (CI) pipelines are implemented through Github Actions to ensure that code changes are automatically tested and built. This helps maintain code quality, catch issues early, and streamline the release process, making development more efficient and reliable.

Continuous Deployment (CD) is implemented through helm and terraform, automating the majority of deployment tasks including building, packaging and spinning up infrastructure, yet still limiting to a manual deployment ensuring details are checked by human eyes.
