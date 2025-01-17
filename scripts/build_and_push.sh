#!/bin/bash
set -e

# Config
PROJECT_ID="dsp-registry-410602"
LOCATION="australia-southeast1"
REPOSITORY="docker"
IMAGE="ctrl"
TAG="latest"

IMAGE_PATH=${LOCATION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE}:${TAG}

# Build Docker image
echo "Building Docker image..."
docker build -f ./Dockerfile.backend -t ${IMAGE_PATH} .

# Push to Artifact Registry
echo "Pushing to ${LOCATION} Artifact Registry..."
docker push ${IMAGE_PATH}

echo "Done! Image available at: ${IMAGE_PATH}"
