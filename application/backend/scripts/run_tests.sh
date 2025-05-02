set -e

# Parse node version
NODE_VERSION=$(cat .nvmrc | tr -d 'v')

# Spin-up db
NODE_VERSION=$(NODE_VERSION) docker compose up -d db-test --wait

docker compose down backend-test

# migrate db
yarn prisma:generate
npx dotenv -e .env.test -- yarn prisma migrate deploy

# run tests
TZ=UTC npx dotenv -e .env.test -- jest --detectOpenHandles --runInBand --coverage "$@"

# Adding node version to silence a warning
NODE_VERSION=$(NODE_VERSION) docker compose down db-test
