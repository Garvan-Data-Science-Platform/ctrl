ARG NODE_VERSION

FROM node:${NODE_VERSION}-alpine

# Create openssl symlink if required (it was required when this line was added)
# https://github.com/prisma/prisma/issues/25817
RUN [ ! -e /lib/libssl.so.3 ] && ln -s /usr/lib/libssl.so.3 /lib/libssl.so.3 || echo "Link already exists"

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
COPY application/backend/.env.dockerprod application/backend/.env
COPY application/common application/common
COPY application/integrations application/integrations

RUN yarn workspace backend build 
RUN yarn workspace backend tsoa:spec
RUN yarn workspace backend prisma:generate

RUN echo '{smtp:{username:"",password:"",host:"",port:0}}' > application/backend/config/config.json5

#ENTRYPOINT ["tail", "-f", "/dev/null"]
ENTRYPOINT [ "sh", "application/backend/scripts/entrypoint.sh" ]
