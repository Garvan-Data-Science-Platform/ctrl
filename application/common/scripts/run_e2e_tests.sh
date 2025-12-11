set -e

# Parse node version
NODE_VERSION=$(cat ../../.nvmrc | tr -d 'v')
E2E_NODE_ENV="e2e"

# Default mode is 'run' if no argument is provider

if [ "$CYPRESS_MODE" != "open" ] && [ "$CYPRESS_MODE" != "run" ]; then
    echo "Invalid mode. Use 'open' or 'run'"
    exit 1
fi

echo "Running tests in cypress $CYPRESS_MODE mode"

# Spin-up backend, db, and mailhog
NODE_VERSION=$NODE_VERSION E2E_NODE_ENV=$E2E_NODE_ENV docker compose up --build -d --wait db-test mailhog backend-test

# Generate prisma types
yarn workspace backend prisma:generate

# Start both clients and run tests
# user-client on port 5002, admin-client on port 5003
npx dotenv -e ../backend/.env.test start-server-and-test \
  "yarn workspace user-client dev --port 5002 --host 0.0.0.0 & yarn workspace admin-client dev --port 5003 --host 0.0.0.0 & wait" \
  "http://localhost:5002|http://localhost:5003" \
  "npx cypress $CYPRESS_MODE --project e2e-tests"

# Tear down
#   Adding node version to silence a warning
NODE_VERSION=$NODE_VERSION docker compose down db-test mailhog backend-test

