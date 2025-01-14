FROM node:22-alpine AS base

RUN mkdir app
WORKDIR /app

# # Install build dependencies
# RUN apk add --no-cache \
#     python3 \
#     make \
#     g++ \
#     libc6-compat \
#     openssl

# Copy workspace config
COPY package.json yarn.lock ./
COPY application/admin-client/package.json ./application/admin-client/
COPY application/user-client/package.json ./application/user-client/
COPY application/backend/package.json ./application/backend/
COPY application/common/package.json ./application/common/
COPY application/integrations/package.json ./application/integrations/

RUN corepack enable

# Copy source code
COPY . .

# Install dependencies
RUN rm -rf node_modules && yarn install --frozen-lockfile

# Generate Prisma client
RUN yarn prisma:generate

# Build packages in order
RUN yarn build

# Production image
FROM node:22-alpine

# Expose port
EXPOSE 3000

# Start backend
CMD ["/bin/sh"]
