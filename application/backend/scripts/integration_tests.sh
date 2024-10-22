set -e

# Spin-up db
docker compose --env-file .env up -d

# Wait for db
echo "Waiting for db to spin up..."
sleep 5

# migrate db
yarn prisma migrate deploy

# run tests
jest --detectOpenHandles --coverage $1

docker compose down
