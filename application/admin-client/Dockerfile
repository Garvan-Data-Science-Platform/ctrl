#Must be built from top directory

ARG NODE_VERSION
ARG APP_VERSION

FROM node:${NODE_VERSION}-alpine AS build

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

WORKDIR /usr/src/app

ENV VITE_BACKEND_URL "/api"
ENV VITE_APP_VERSION $APP_VERSION

COPY package.json .yarnrc.yml yarn.lock ./
COPY application/admin-client/package.json application/admin-client/
COPY application/user-client/package.json application/user-client/
COPY application/backend/package.json application/backend/
COPY application/common/package.json application/common/

RUN corepack enable && yarn 

COPY application/admin-client application/admin-client
COPY application/backend application/backend
COPY application/common application/common

RUN yarn workspace backend prisma:generate

RUN yarn workspace admin-client build

FROM nginx

COPY --from=build /usr/src/app/application/admin-client/dist /usr/share/nginx/html

RUN rm /etc/nginx/conf.d/default.conf && touch /etc/nginx/conf.d/default.conf

RUN <<EOF
echo "server {" >> /etc/nginx/conf.d/default.conf
echo "  listen 80;" >> /etc/nginx/conf.d/default.conf
echo "" >> /etc/nginx/conf.d/default.conf
echo "  gzip on;" >> /etc/nginx/conf.d/default.conf
echo "  gzip_proxied any;" >> /etc/nginx/conf.d/default.conf
echo "  gzip_comp_level 6;" >> /etc/nginx/conf.d/default.conf
echo "  gzip_buffers 16 8k;" >> /etc/nginx/conf.d/default.conf
echo "  gzip_http_version 1.1;" >> /etc/nginx/conf.d/default.conf
echo "  gzip_types text/css application/javascript application/json application/font-woff application/font-tff image/gif image/png image/svg+xml application/octet-stream;" >> /etc/nginx/conf.d/default.conf
echo "  gzip_vary on;" >> /etc/nginx/conf.d/default.conf
echo "" >> /etc/nginx/conf.d/default.conf
echo "  location / {" >> /etc/nginx/conf.d/default.conf
echo "    root   /usr/share/nginx/html;" >> /etc/nginx/conf.d/default.conf
echo "    index  index.html index.htm;" >> /etc/nginx/conf.d/default.conf
echo "    try_files \$uri /index.html =404;" >> /etc/nginx/conf.d/default.conf
echo "  }" >> /etc/nginx/conf.d/default.conf
echo "" >> /etc/nginx/conf.d/default.conf
echo "  error_page   500 502 503 504  /50x.html;" >> /etc/nginx/conf.d/default.conf
echo "" >> /etc/nginx/conf.d/default.conf
echo "  location = /50x.html {" >> /etc/nginx/conf.d/default.conf
echo "    root   /usr/share/nginx/html;" >> /etc/nginx/conf.d/default.conf
echo "  }" >> /etc/nginx/conf.d/default.conf
echo "}" >> /etc/nginx/conf.d/default.conf
EOF
