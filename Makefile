# Extract node version from file .nvmrc and remove the leading 'v'.
NODE_VERSION=$(shell cat .nvmrc|sed 's/^v//')

.PHONY: help 

# Keep 'help' as first target, 
help:
	@echo "--- List of available targets:"
	@echo "- help - print this help message."
	@echo "- e2e - spin up db/frontend/backend and run e2e tests"
	@echo "- db - spin up db"

e2e:
	docker compose up -d
	yarn workspace backend build
	yarn workspace user-client build
	yarn workspace backend start & \
	export BACKEND_PID=$$! ; \
	yarn workspace user-client preview & \
	export FRONTEND_PID=$$! ; \
	yarn workspace user-client cy:run; \
	kill $${FRONTEND_PID}; \
	kill $${BACKEND_PID}

db: 
	docker compose up -d