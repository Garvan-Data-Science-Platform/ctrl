#Must be built from top directory

ARG NODE_VERSION=20.10.0

FROM node:${NODE_VERSION}-alpine AS build

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

WORKDIR /usr/src/app

ENV VITE_BACKEND_URL "/api"

COPY package.json .yarnrc.yml yarn.lock ./
COPY application/user-client/package.json application/user-client/
COPY application/backend/package.json application/backend/
COPY application/common/package.json application/common/

RUN corepack enable && yarn 

COPY application/user-client application/user-client
COPY application/backend application/backend
COPY application/common application/common

RUN yarn workspace backend prisma:generate

RUN yarn workspace user-client build 

FROM nginx

COPY --from=build /usr/src/app/application/user-client/dist /usr/share/nginx/html