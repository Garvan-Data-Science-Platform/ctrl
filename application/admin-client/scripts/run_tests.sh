set -e

# Parse node version
NODE_VERSION=$(cat ../../.nvmrc | tr -d 'v')

# Default mode is 'run' if no argument is provider

if [ "$CYPRESS_MODE" != "open" ] && [ "$CYPRESS_MODE" != "run" ]; then
    echo "Invalid mode. Use 'open' or 'run'"
    exit 1
fi

echo "Running tests in cypress $CYPRESS_MODE mode"

# Spin-up backend and db
NODE_VERSION=$NODE_VERSION docker compose up --build -d --wait db-test backend-test

# Generate prisma types
yarn workspace backend prisma:generate

# run tests
npx dotenv -e ../backend/.env.test start-server-and-test 'vite dev --port 5003 --host 0.0.0.0' http://localhost:5003 cy:$CYPRESS_MODE

# Tear down
#   Adding node version to silence a warning
NODE_VERSION=$NODE_VERSION docker compose down db-test backend-test
