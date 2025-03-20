set -e

# Default mode is 'run' if no argument is provider

if [ "$CYPRESS_MODE" != "open" ] && [ "$CYPRESS_MODE" != "run" ]; then
    echo "Invalid mode. Use 'open' or 'run'"
    exit 1
fi

echo "Running tests in cypress $CYPRESS_MODE mode"

# Spin-up backend and db
docker compose up --build -d --wait db-test
echo "Waiting for db to spin up..."
sleep 3 # Wait for db to spin up
docker compose up --build -d --wait backend-test

# Generate prisma types
yarn workspace backend prisma:generate

# run tests
npx dotenv -e ../../backend/.env.test start-server-and-test 'vite --port 5002 --host 0.0.0.0' http://localhost:5002 cy:$CYPRESS_MODE

# Tear down
docker compose down db-test backend-test
