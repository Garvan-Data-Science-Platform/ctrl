# backend

### Setup

```bash
# Copy example env variables and fill out with correct values
cp .env.example .env

# Run db
make docker-run-db

# Generate Prisma Client
yarn prisma:generate

# Seed database
yarn prisma:seed

# Run migrations
yarn prisma:migrate
```
