# Extract node version from file .nvmrc and remove the leading 'v'.
NODE_VERSION=$(shell cat .nvmrc|sed 's/^v//')

.PHONY: help 

# Keep 'help' as first target, 
help:
	@echo "--- List of available targets:"
	@echo "- help - print this help message."
	@echo "- docker-build - build/tag the ctrl-next:latest Docker image."
	@echo "- docker-run - run ctrl-next and its DB from docker images."
	@echo "- docker-run-db - run the DB from its docker image"

docker-build:
	docker build --build-arg="NODE_VERSION=$(NODE_VERSION)" -t ctrl-next:latest .

docker-run:
	docker-compose up

docker-run-db:
	docker-compose up db
