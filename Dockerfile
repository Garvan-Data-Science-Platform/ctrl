# Pass the desired Node.js version with: docker build --build-arg="NODE_VERSION=x.y.z"
# The string used instead of a default Node version is a hack: it prevents using an
# outdated default version and prints a clear message if build-arg is omitted.
ARG NODE_VERSION="YOU_MUST_PASS_A_VALID_NODE_VERSION_TO_THE_DOCKERFILE"

# The default base image entrypoint executes arguments as arbitrary Bash commands and
# runs Node.js if no argument is passed. Setting CMD we're still able to freely run
# any command, but the default behaviour becomes starting our application.
FROM node:${NODE_VERSION}
CMD ["yarn", "start"]

WORKDIR /app
COPY . /app

RUN : \
  # Enabling corepack automatically selects "yarn modern" over "yarn classic".
  # Alternatively we could use: 'yarn set version stable'
  # or choose an exact version of yarn: 'yarn set version 4.0.2'
  && corepack enable \
  && yarn install \
  && yarn build
