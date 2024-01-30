FROM ubuntu:22.04

ENV FRONTEND_HOST=apphostname
ENV FRONTEND_PORT=3000

ENV BACKEND_HOST=apphostname
ENV BACKEND_PORT=5000

ENV NVM_DIR /usr/local/nvm

SHELL ["/bin/bash", "-lc"]
ENTRYPOINT ["/bin/bash", "-lc"]

WORKDIR /app
COPY . /app

RUN : \
  && set -x \
  && mkdir -p "$NVM_DIR" \
  && apt-get update \
  && apt-get install -y curl build-essential libssl-dev \
  && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash \
  && cp "$NVM_DIR/nvm.sh" /etc/profile.d/nvm.sh \
  && chmod +x /etc/profile.d/nvm.sh \
  && . "$NVM_DIR/nvm.sh" --no-use \
  && nvm install \
  && nvm use \
  && corepack enable \
  && yarn install \
  && yarn build \
  && ( cd application/frontend && yarn playwright install ) \
  && ( cd application/frontend && yarn playwright install-deps )
