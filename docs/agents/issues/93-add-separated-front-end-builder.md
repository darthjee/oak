# Issue: Add Separated Front-End Builder

## Description

Add a new Docker container using Vite to build the front-end with React and Bootstrap. The front-end lives in the `frontend/` folder and is served by the tent proxy. For now, only a placeholder `/` page is needed.

## Problem

- The front-end is currently coupled to the Rails app (AngularJS served via ERB templates).
- There is no standalone React build pipeline or dedicated front-end container.

## Expected Behavior

- A `frontend/` folder exists at the project root containing a React + Bootstrap app built with Vite.
- The front-end has Jasmine specs and ESLint configured.
- Two new CircleCI jobs exist: `jasmine` (front-end tests) and `frontend-checks` (lint). The `release` job depends on both.
- The tent proxy serves the front-end in two modes:
  - **Dev mode**: proxies all requests to the Vite dev server (no cache).
  - **Non-dev mode**: serves static files from a `static/` folder mounted from `frontend/dist/` (Vite build output).
- The front-end Docker image is based on `darthjee/node`.
- A dedicated documentation file exists in `docs/agents/` explaining the front-end setup.
- The `/` route renders a placeholder page with the text "placeholder".

## Solution

- Create `frontend/` with React + Bootstrap + Vite scaffold (package.json, vite.config.js, index.html, eslint config, jasmine spec setup).
- Create `dockerfiles/vite_oak-base/Dockerfile` (base image based on `darthjee/node`) and `dockerfiles/vite_oak/Dockerfile` (dev image for docker-compose).
- Add `oak_fe` service to `docker-compose.yml`; update `oak_proxy` volumes and links.
- Add `docker_volumes/proxy_configuration/rules/frontend.php` with dev/non-dev routing rules.
- Update `docker_volumes/proxy_configuration/configure.php` to include the new frontend rule.
- Add `jasmine` and `frontend-checks` jobs to `.circleci/config.yml`; gate `release` on them.
- Create `docs/agents/frontend.md` documenting the front-end setup.

## Benefits

- Establishes the standalone front-end pipeline that subsequent issues (resources, pages) will build upon.
- Enables independent front-end development with HMR via Vite.
- Modernizes the stack without breaking the existing Rails JSON API.

---
See issue for details: https://github.com/darthjee/oak/issues/93
