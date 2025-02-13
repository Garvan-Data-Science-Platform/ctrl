ARG NODE_VERSION=20.10.0

FROM node:${NODE_VERSION}-alpine

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

WORKDIR /usr/src/app

ENV PORT 5000
EXPOSE $PORT

COPY package.json .yarnrc.yml yarn.lock ./
COPY application/backend/package.json application/backend/
COPY application/common/package.json application/common/
COPY application/integrations/package.json application/integrations/

RUN corepack enable && yarn 

COPY application/backend application/backend
COPY application/common application/common
COPY application/integrations application/integrations

RUN yarn workspace backend build 
RUN yarn workspace backend tsoa:spec


#ENTRYPOINT ["tail", "-f", "/dev/null"]
ENTRYPOINT [ "sh", "application/backend/scripts/entrypoint.sh" ]