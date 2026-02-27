.PHONY: build-base push-base build push dev

PROJECT?=oak
IMAGE?=$(PROJECT)
BASE_VERSION?=0.0.4
BASE_IMAGE?=$(DOCKER_ID_USER)/$(PROJECT)-base
PUSH_IMAGE=$(DOCKER_ID_USER)/$(PROJECT)
DOCKER_FILE_BASE=dockerfiles/$(PROJECT)-base/Dockerfile

all:
	@echo "Usage:"
	@echo "  make build\n    Build docker image for $(PROJECT)"
	@echo "  make build-base\n    Build base docker image for $(PROJECT)"
	@echo "  make push-base\n    Pushes base docker image for $(PROJECT) to dockerhub"
	@echo "  make push\n    Pushes docker image for $(PROJECT) to dockerhub"
	@echo "  make dev\n    Run $(PROJECT) app in development mode"
	@echo "  make dev-up\n    Run $(PROJECT) app and proxy in development mode"
	@echo "  make tests\n    Run $(PROJECT) tests"
	@echo "  make setup\n    Run $(PROJECT) setup script"

build-base:
	docker tag $(BASE_IMAGE):latest $(BASE_IMAGE):cached; \
	docker rmi $(BASE_IMAGE):latest; \
	docker build -f $(DOCKER_FILE_BASE) . -t $(BASE_IMAGE):latest -t $(BASE_IMAGE):$(BASE_VERSION); \
	if (docker images | grep $(BASE_IMAGE) | grep cached); then \
	  docker rmi $(BASE_IMAGE):cached; \
	fi \

push-base:
	make build-base
	docker push $(BASE_IMAGE)
	docker push $(BASE_IMAGE):$(BASE_VERSION)

build:
	docker build -f dockerfiles/$(PROJECT)/Dockerfile . -t $(IMAGE) -t $(PUSH_IMAGE) -t $(PUSH_IMAGE):$(BASE_VERSION)

push:
	make build
	docker push $(PUSH_IMAGE)
	docker push $(PUSH_IMAGE):$(BASE_VERSION)

tests:
	docker-compose run $(PROJECT)_tests /bin/bash

dev:
	docker-compose run $(PROJECT)_app /bin/bash

dev-up:
	docker-compose up $(PROJECT)_proxy $(PROJECT)_app

setup: .env
	docker-compose run $(PROJECT)_app bin/setup.sh

.env:
	cp .env.dev.sample .env

.env.production:
	touch .env.production
