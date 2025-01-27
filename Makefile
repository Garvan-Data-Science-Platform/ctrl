# Extract node version from file .nvmrc and remove the leading 'v'.
NODE_VERSION=$(shell cat .nvmrc|sed 's/^v//')

.PHONY: help 

# Keep 'help' as first target, 
help:
	@echo "--- List of available targets:"
	@echo "- help    - print this help message."
	@echo "- e2e     - spin up db/frontend/backend and run e2e tests"
	@echo "- db      - spin up db"
	@echo "- db-down - bring down db"
	@echo "- clean   - bring down docker containers and remove db volume"
	@echo "- seed    - apply migrations and seed db"
	@echo "---"

e2e:
	docker compose up -d db-test
	yarn workspace backend build
	yarn workspace user-client build
	yarn workspace backend start & \
	export BACKEND_PID=$$! ; \
	yarn workspace user-client preview & \
	export FRONTEND_PID=$$! ; \
	yarn workspace user-client cy:run; \
	export EXIT_CODE=$$?;\
	kill $${FRONTEND_PID}; \
	kill $${BACKEND_PID}; \
    exit $$EXIT_CODE
	docker compose down db-test

# Check everything that will run in ci
check:
	yarn workspace backend build
	yarn type-check
	yarn format
	yarn lint
	yarn test
	make e2e

db: 
	docker compose up -d db
	docker compose up -d admin

db-down:
	docker compose down

seed:
	yarn prisma:migrate
	yarn prisma:seed

clean: db-down
	docker volume rm ctrl-next_ctrl-db
