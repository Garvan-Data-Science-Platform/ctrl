# Guidance for contributing to `ctrl-next`

- [Guidance for contributing to `ctrl-next`](#guidance-for-contributing-to-ctrl-next)
  - [Welcome](#welcome)
  - [Development Tooling](#development-tooling)
  - [Git + GitHub](#git--github)
  - [Node.js](#nodejs)
  - [API Documentation](#api-documentation)
    - [Swagger](#swagger)
    - [Editing Swagger Documentation](#editing-swagger-documentation)

## Welcome

Thank you for being interested in contributing to this project!
Please see the information below for guidance on how to get set up with a suitable development environment, and how to collaborate with the project team via GitHub.

## Development Tooling

This project uses [pre-commit](https://pre-commit.com/) to ensure code quality is up to scratch. Please see [installation steps](https://pre-commit.com/#install).

```bash
# You can also install through Homebrew (MacOS)
brew install pre-commit

# Once installed, setup pre-commit in the project by running
pre-commit install
```

## Git + GitHub

Please create issues, and develop work in branches named using the pattern: `feature/issue-##-short-description`.
Submit [pull requests](https://docs.github.com/en/pull-requests) to the `dev` branch (this is the default branch for this repository).
We are using branch protection rules so that all work must be reviewed before it can be merged into the `dev` branch.
Commits in `feature` branches will be squashed when merged into the `dev` branch.
Code review helps improve code quality and performance.

## Node.js
ctrl-next uses a recent Node.js version as specified in `.nvmrc` in combination with the yarn modern package manager through corepack.

This `.nvmrc` is the single source of truth through out this app to specify the Node Version.
For example: Dockerfiles, `run_tests.sh` scripts, the Makefile and multiple CI workflows all parse the node version from the `.nvmrc`.
If you want to update node version, please only change the `.nvmrc`.
If you find yourself specifying the node version somewhere else in the app, please continue the approach of parsing the `.nvmrc` file (or apply an improved approach throughout the rest of the app).

## API Documentation

### Swagger

This project uses Swagger UI to provide easy access to api documentation.

To access the Swagger UI documentation, follow these steps:

1. Start the Server: Ensure your development server is running.

```bash
yarn run dev
# or
make docker-run
```

_**NOTE**: If you want to run the server using Yarn, you should also setup the postgres database container using, `make db`._

1. Open Your Browser: Navigate to the Swagger UI by visiting:

```bash
http://localhost:{port}/docs
```

_**NOTE**_

_Replace {port} with the port number your server is running on (typically 5000)._

_Currently, there is a known issue where swagger docs are not available if you are running server as a docker container._

### Editing Swagger Documentation

This project uses [tsoa](https://tsoa-community.github.io/docs/) to automatically get accurate, complete, correct and up-to-date OpenAPI Specifications from code, and so to update or add new endpoints to the API documentation, follow these guidelines:

1. **Define Endpoints in Code:** Ensure your API routes are properly documented in your code.

2. **Update Swagger docs:** After making API changes, please update the routes and specs by running the following:

   ```bash
   # Updates tsoa routes and specs
   yarn build-docs
   ```

3. **Test the Documentation:** Restart your server and check the Swagger UI to ensure the documentation displays correctly and the new endpoints are accessible.
