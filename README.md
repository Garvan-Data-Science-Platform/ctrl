# ctrl-next

ctrl-next is the next incarnation of the dynamic consent platform CTRL developed by Australian Genomics and the Garvan Institute of Medical Research, designed to deliver new features in a faster and more robust way through the use of modern web technologies.

## Running locally via node

ctrl-next uses a recent Node.js version as specified in `.nvmrc` in combination with the yarn modern package manager through corepack.

### Install required software and packages

The use of `nvm` to manage node versions is highly recommended. Install `nvm` using [these instructions](https://github.com/nvm-sh/nvm).

Then from the root of the `ctrl-next` repository run the following commands:

```bash
# Install the required node version, will do nothing if already installed.
nvm install

# Use the required node version, as specified in the file .nvmrc
nvm use

# Enable corepack to use "yarn modern"
corepack enable

# Finally install all project dependencies
yarn install
```

### Run servers

Run the backend and frontend servers in development mode (with hot reload):

`yarn dev`

Open http://localhost:3000 with your browser to see the local frontend. You can also invoke the backend RESP API on port 5000, e.g. with:

`curl http://localhost:5000/workspaces`

### Other available yarn targets

You can use yarn to perform these additional development tasks:

```bash
# Run the Typescript compiler (i.e. perform a type-check on the code).
yarn type-check

# Run prettier to format the code.
yarn format

# Run eslint to lint the code.
yarn lint

# Run jest to test the code.
yarn test

# Perform a full project build.
yarn build

# Run the application (API and UI) from the build.
yarn start
```

## Running locally via docker

A docker image of `ctrl-next` can be built and used to run the built application (as with the command `yarn start`) or any of the `yarn` commands listed above. Along with the [Dockerfile](Dockerfile), a [Makefile](Makefile) is provided to facilitate running common docker commands:

```bash
# Build the ctrl-next docker image (with tag 'latest')
make docker-build

# If you know what you're doing you might use the Dockerfile directly,
# e.g. to specify alternative Node versions or docker tags.
docker build \
  --build-arg="NODE_VERSION=X.Y.Z" \  # Must pass a valid Node.js version
  -t ctrl-next:latest
  -f Dockerfile .
```

**Note**: an [alternative Dockerfile](Dockerfile_with_nvm) is provided, that install Node.js through `nvm`.

To run `ctrl-next` once the image has been built and its Postgres DB a [docker-compose.yml](docker-compose.yml) file is provided. The following commands are supported:

```bash
# Run ctrl-next and DB from docker images.
make docker-run:

# Stop ctrl-next and DB docker containers.
make docker-stop:

# Run the DB only (to access it from the ctrl-next code in development).
make docker-run-db:
```

#### Advanced uses of the ctrl-next docker-image

By default the `ctrl-next` docker image will simply run a build of `ctrl-next`. Any command line arguments passed to `docker run` will be interpreted as Bash commands and executed from the `ctrl-next` repository root inside the container.

For instance, to run type-checks on the code in the container use:

```bash
docker run ctrl-next:latest yarn type-check
```

## Prisma Database Management

```bash
# Copy example env variables and fill out with correct values
cp application/backend/.env.example application/backend/.env

# Run db
make docker-run-db

# Generate Prisma Client
yarn prisma:generate

# Run migrations
yarn prisma:migrate
```
