set -e

# Parse node version
NODE_VERSION=$(cat ../../.nvmrc | tr -d 'v')
E2E_NODE_ENV="e2e"

# Services IMAGE_URLs
REGISTRY_URL=australia-southeast1-docker.pkg.dev/dsp-registry-410602/garvan-public

# Default mode is 'run' if no argument is provided
if [ -z "$CYPRESS_MODE" ]; then
    CYPRESS_MODE="run"
fi

if [ "$CYPRESS_MODE" != "open" ] && [ "$CYPRESS_MODE" != "run" ]; then
    echo "Invalid mode. Use 'open' or 'run'"
    exit 1
fi

echo "Running tests in cypress $CYPRESS_MODE mode"


# Spin-up backend, db, and mailhog
COMPOSE_FILES=" -f ../../docker-compose.e2e.yml"

if [ -n "$IMAGE_TAG" ]; then
    echo "IMAGE_TAG detected: $IMAGE_TAG. Using image-based services."
    USER_CLIENT_IMAGE_URL=$REGISTRY_URL/ctrl-user-client:$IMAGE_TAG
    ADMIN_CLIENT_IMAGE_URL=$REGISTRY_URL/ctrl-admin-client:$IMAGE_TAG
    BACKEND_IMAGE_URL=$REGISTRY_URL/ctrl-backend:$IMAGE_TAG
else
    echo "No IMAGE_TAG detected. Building local source services."
    IMAGE_TAG="local"

    export BACKEND_IMAGE_URL=backend:$IMAGE_TAG
    export USER_CLIENT_IMAGE_URL=user-client:$IMAGE_TAG
    export ADMIN_CLIENT_IMAGE_URL=admin-client:$IMAGE_TAG

    docker buildx build -t $BACKEND_IMAGE_URL --build-arg NODE_VERSION=$NODE_VERSION -D -f ../backend/Dockerfile ../../
    docker buildx build -t $USER_CLIENT_IMAGE_URL --build-arg NODE_VERSION=$NODE_VERSION -D -f ../user-client/Dockerfile ../../
    docker buildx build -t $ADMIN_CLIENT_IMAGE_URL --build-arg NODE_VERSION=$NODE_VERSION -D -f ../admin-client/Dockerfile ../../
fi

NODE_VERSION=$NODE_VERSION E2E_NODE_ENV=$E2E_NODE_ENV docker compose $COMPOSE_FILES up --build -d

npx cypress $CYPRESS_MODE

# Tear down
#   Adding node version to silence a warning
NODE_VERSION=$NODE_VERSION docker compose $COMPOSE_FILES down

