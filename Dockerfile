FROM ubuntu:22.04

ENV NVM_DIR /usr/local/nvm

SHELL ["/bin/bash", "-c"]

WORKDIR /app
COPY . /app

RUN : \
  && set -x \
  && mkdir -p "$NVM_DIR" \
  && apt-get update \
  && apt-get install -y curl build-essential libssl-dev \
  && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash \
  && . "$NVM_DIR/nvm.sh" --no-use \
  && echo 'export NVM_DIR="$NVM_DIR"' >> /etc/profile.d/nvm.sh \
  && echo '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"' >> /etc/profile.d/nvm.sh \
  && nvm install \
  && nvm use \
  && corepack enable \
  && yarn install \
  && yarn type-check \
  && yarn build

CMD yarn start
