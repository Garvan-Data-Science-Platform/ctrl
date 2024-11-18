set -e

# Spin-up db
docker compose up -d db-test --wait

# migrate db
dotenv -e .env.test -- yarn prisma migrate deploy

# run tests
dotenv -e .env.test -- jest --detectOpenHandles --runInBand --coverage $1

docker compose down db-test
