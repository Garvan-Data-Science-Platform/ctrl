# Extract node version from file .nvmrc and remove the leading 'v'.
NODE_VERSION=$(shell cat .nvmrc|sed 's/^v//')

# Config for local deployment with minikube and helm
LOCAL_DEPLOYMENT:=ctrl-local
LOCAL_CONFIG:=demoMode.enabled=true,$\
	userClient.image.repository=docker.io/library/user-client,$\
	userClient.image.pullPolicy=Never,$\
	adminClient.image.repository=docker.io/library/admin-client,$\
	adminClient.image.pullPolicy=Never,$\
	backend.image.repository=docker.io/library/backend,$\
	backend.image.pullPolicy=Never

.PHONY: help

# Keep 'help' as first target,
help:
	@echo "--- List of available targets:"
	@echo "- help           - print this help message."
	@echo "- db             - spin up db"
	@echo "- db-down        - bring down db"
	@echo "- clean          - bring down docker containers and remove db volume"
	@echo "- seed           - apply migrations and seed db"
	@echo "- kube-start     - start minikube cluster"
	@echo "- kube-delete    - delete minikube cluster"
	@echo "- docker         - build local docker images"
	@echo "- install        - local helm deployment"
	@echo "- upgrade        - local helm upgrade"
	@echo "- uninstall      - local helm remove deployment"
	@echo "---"

# Check everything that will run in ci
check:
	yarn workspace backend build
	yarn type-check
	yarn format
	yarn lint
	yarn test
	make e2e

db: 
	NODE_VERSION=$(NODE_VERSION) docker compose up -d db
	NODE_VERSION=$(NODE_VERSION) docker compose up -d admin

db-down:
	NODE_VERSION=$(NODE_VERSION) docker compose down

seed:
	yarn prisma:migrate
	yarn prisma:seed

clean: db-down
	NODE_VERSION=$(NODE_VERSION) docker volume rm ctrl-next_ctrl-db

# Local deployment via minikube and helm

# Build images

kube-start:
	minikube start

kube-delete:
	minikube delete

docker:
	eval $$(minikube -p minikube docker-env) && \
	docker build --build-arg NODE_VERSION=$(NODE_VERSION) -t user-client -f application/user-client/Dockerfile . && \
	docker build --build-arg NODE_VERSION=$(NODE_VERSION) -t admin-client -f application/admin-client/Dockerfile . && \
	docker build --build-arg NODE_VERSION=$(NODE_VERSION) -t backend -f application/backend/Dockerfile .

install:
	helm install $(LOCAL_DEPLOYMENT) .helm/ctrl \
		--set $(LOCAL_CONFIG)

upgrade:
	helm upgrade $(LOCAL_DEPLOYMENT) .helm/ctrl \
		--set $(LOCAL_CONFIG)

uninstall:
	helm uninstall $(LOCAL_DEPLOYMENT)
