# Docker Plan

Steps 2–4 of [plan.md](plan.md). Create the `proxy/static/` folder, the two Dockerfiles, and update `docker-compose.yml`.

Reference: `../weave/dockerfiles/vite_weave-base/`, `../weave/dockerfiles/vite_weave/`, `../weave/docker-compose.yml`.

---

## Step 2 — Create `proxy/static/`

Create `proxy/static/` at the project root. This directory is mounted at `/var/www/html/static/` inside `oak_proxy` and holds assets served statically by tent (images, fonts, etc.).

For now it can be empty — add a `.keep` file so git tracks it:

```
proxy/static/.keep
```

---

## Step 3 — Dockerfiles

Two images are needed, following the weave two-image pattern.

### `dockerfiles/vite_oak-base/Dockerfile`

Base image to be published as `darthjee/vite_oak-base`. Mirror of `../weave/dockerfiles/vite_weave-base/Dockerfile`:

```dockerfile
FROM darthjee/scripts:0.5.3 as scripts
FROM darthjee/node:0.2.1 as base

USER root
RUN apt-get update && apt-get install -y rsync && rm -rf /var/lib/apt/lists/*
USER node

COPY --chown=node:node \
  ./frontend/package.json frontend/yarn.lock \
  /home/node/app/
COPY --chown=node:node --from=scripts \
  /home/scripts/sbin/deploy_frontend.sh /usr/local/sbin/

######################################

FROM base as builder

ENV HOME_DIR /home/node

USER root
COPY --chown=node:node --from=scripts /home/scripts/builder/yarn_builder.sh /usr/local/sbin/yarn_builder.sh
RUN /bin/bash yarn_builder.sh

#######################
# FINAL IMAGE
FROM base
ENV HOME_DIR /home/node

COPY --chown=node:node --from=builder /home/node/yarn/new/ /usr/local/share/.cache/yarn/v6/

USER node

CMD ["npm", "run", "server"]
```

> Until this image is published to Docker Hub, substitute `darthjee/vite_weave-base:0.0.4` in the next Dockerfile and in CI.

### `dockerfiles/vite_oak/Dockerfile`

Dev image used in `docker-compose build`. Mirror of `../weave/dockerfiles/vite_weave/Dockerfile`:

```dockerfile
FROM darthjee/scripts:0.5.3 as scripts
FROM darthjee/vite_oak-base:0.0.1 as base

COPY --chown=node:node \
  ./frontend/package.json frontend/yarn.lock \
  /home/node/app/

######################################

FROM base as builder

ENV HOME_DIR /home/node

USER root
COPY --chown=app:app --from=scripts /home/scripts/builder/yarn_builder.sh /usr/local/sbin/yarn_builder.sh
RUN /bin/bash yarn_builder.sh

#######################
# FINAL IMAGE
FROM base
ENV HOME_DIR /home/node

COPY --chown=node:node --from=builder /home/node/yarn/new/ /usr/local/share/.cache/yarn/v6/

USER node
```

**Why two images?**
- `vite_oak-base` is the published base image: it installs system dependencies (rsync), the yarn cache, and sets the default `CMD`. It is also used in CI for asset builds.
- `vite_oak` is the local dev image: it pre-warms the yarn cache at build time so `docker-compose up` starts faster. It has no `CMD` — the dev server starts via the volume-mounted source.

---

## Step 4 — Update `docker-compose.yml`

### Add `oak_fe` service

Add after the existing base services, following the pattern of `weave_fe` in `../weave/docker-compose.yml`:

```yaml
oak_fe:
  container_name: oak_fe
  build:
    context: .
    dockerfile: dockerfiles/vite_oak/Dockerfile
  volumes:
    - ./frontend:/home/node/app
    - ./docker_volumes/node_modules:/home/node/app/node_modules
    - ./docker_volumes/static:/home/node/app/dist
  ports:
    - 0.0.0.0:3020:8080
  env_file: .env
```

**Volume explanation:**
- `./frontend:/home/node/app` — mounts source code; Vite watches it for HMR.
- `./docker_volumes/node_modules:/home/node/app/node_modules` — node_modules cache persisted on the host, avoiding repeated installs.
- `./docker_volumes/static:/home/node/app/dist` — Vite build output lands here; `oak_proxy` reads from it.

### Update `oak_proxy`

Replace the current `oak_proxy` definition with:

```yaml
oak_proxy:
  image: darthjee/tent:0.5.0
  container_name: oak_proxy
  env_file: .env
  volumes:
    - ./proxy/static/:/var/www/html/static/
    - ./docker_volumes/static/index.html:/var/www/html/static/index.html
    - ./docker_volumes/static/assets/js/:/var/www/html/static/assets/js/
    - ./docker_volumes/static/assets/css/:/var/www/html/static/assets/css/
    - ./docker_volumes/proxy_configuration:/var/www/html/configuration/
    - ./docker_volumes/proxy_cache:/var/www/html/cache/
  links:
    - oak_app:backend
    - oak_fe:frontend
  depends_on:
    - oak_app
    - oak_fe
  ports:
    - 0.0.0.0:3000:80
```

**Volume explanation:**
- `proxy/static/` → base static assets (images, fonts).
- `docker_volumes/static/index.html` and `assets/js/` and `assets/css/` → overlay the Vite-built files on top of `proxy/static/`.

### New docker_volumes entries

Add `.keep` files so git tracks the new empty directories:

```
docker_volumes/static/.keep
docker_volumes/node_modules/.keep
```

### `.env.example`

Add the new variable:

```
FRONTEND_DEV_MODE=true
```
