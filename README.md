# ctrl-next

ctrl-next is the next incarnation of the dynamic consent platform CTRL developed by Australian Genomics and the Garvan Institute of Medical Research, designed to deliver new features in a faster and more robust way through the use of modern web technologies.

## Running locally via node

### Install required software and packages

ctrl-next uses a recent Node.js version as specified in `.nvmrc` in combination with the yarn modern package manager through corepack. 
The use of nvm to manage node versions is highly recommended.
Install nvm (link to [nvm installation instructions](https://github.com/nvm-sh/nvm)), and from the root of the `ctrl-next` repository run the following commands:

### Install the required node version, will do nothing if already installed.

`nvm install`

### Use the required node version.
`nvm use`

### Enable corepack to use yarn

`corepack enable`

Then install yarn dependencies with the following command:

`yarn install`

If you'll be running frontend tests, you'll need to install playright's
dependencies too. Install playwright browsers like this:

```bash
( cd application/frontend && yarn playwright install )
```

If you're on GNU/Linux, you might need to install dpkg packages. The following
command will do that for you:

```bash
( cd application/frontend && yarn playwright install-deps )
```

### Run servers

Run the backend and frontend servers in development mode (with hot reload):

`yarn dev`

Open http://localhost:3000 with your browser to see the local frontend.

## Running the tests locally

```bash
yarn test
```

Other testing-related yarn scripts:

* `type-check` - Runs the type checker (i.e. `tsc`)
* `format` - Autoformatting
* `lint` - Linter

## Running tests via docker

Build the environment, which contains yarn and installed dependencies:

```bash
docker build -t ctrl-next:latest -f Dockerfile .
```

Run the tests:

```bash
docker run -h=apphostname ctrl-next:latest 'yarn test'
```
