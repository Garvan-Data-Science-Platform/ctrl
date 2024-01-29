# ctrl-next

ctrl-next is the next incarnation of the dynamic consent platform CTRL developed by Australian Genomics and the Garvan Institute of Medical Research, designed to deliver new features in a faster and more robust way through the use of modern web technologies.

## Running locally via node

### Install required software and packages

ctrl-next uses a recent Node.js version as specified in `.nvmrc` in combination with the yarn modern package manager through corepack. 
The use of nvm to manage node versions is highly recommended.
Install nvm (link to [nvm installation instructions](https://github.com/nvm-sh/nvm)), and from the root of the `ctrl-next` repository run the following commands:

# Install the required node version, will do nothing if already installed.
`nvm install`

# Use the required node version.
`nvm use`

# Enable corepack to use yarn

`corepack enable`

Then install project dependencies with the following command:

`yarn install`

### Run servers

Run the backend and frontend servers in development mode (with hot reload):

`yarn dev`

Open http://localhost:3000 with your browser to see the local frontend.
