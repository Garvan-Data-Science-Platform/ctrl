set -e

# Spin-up db
docker compose up -d db-test --wait

docker compose down backend-test

# migrate db
+++npx dotenv -e .env.test -- yarn prisma migrate deploy

# run tests
+++npx dotenv -e .env.test -- jest --detectOpenHandles --runInBand --coverage $1

docker compose down db-test