# Plan: Use React Front-End

## Overview

Extract the frontend from the Rails app into a standalone React + Vite application under `frontend/`. The tent proxy serves the React-built assets (or proxies to the Vite dev server in development) and forwards JSON API requests to Rails. The visual appearance and navigation must remain identical. This mirrors the pattern already in use in `../weave`.

## Context

Currently the Rails app serves both the AngularJS SPA (via ERB templates + `?ajax=true`) and the JSON API. Tent proxies all requests to Rails. After this migration, tent will route HTML/asset requests to the React frontend and only forward JSON API calls to Rails. Rails retains its full JSON API — no controller or model changes are needed for the initial migration.

The `../weave` project is the reference implementation: it has a `frontend/` React + Vite app, two Dockerfiles (`vite_weave-base` and `vite_weave`), a `proxy/` folder with static assets, and `docker_volumes/static/` where Vite outputs its built files.

## Phases

This plan is split into four files:

| File | Scope |
|------|-------|
| [plan_infrastructure.md](plan_infrastructure.md) | Steps 1–5: frontend scaffold, proxy folder, Dockerfiles, docker-compose, proxy config |
| [plan_react.md](plan_react.md) | Step 6: React + Vite application implementation |
| [plan_ci.md](plan_ci.md) | Step 7: CircleCI jobs for the frontend |
| [plan_cleanup.md](plan_cleanup.md) | Step 8: Remove AngularJS from Rails |

## Execution Order

Steps 1–5 (infrastructure) can be done without breaking the current app — AngularJS continues to run via Rails while the new stack is wired up. Step 6 (React) is the largest phase and will likely be broken into sub-issues per resource. Step 8 (cleanup) must only happen after Step 6 is validated in production.

## Files Changed (summary)

| File | Change |
|------|--------|
| `frontend/` | New — React + Vite project |
| `proxy/static/` | New — static assets served by tent |
| `dockerfiles/vite_oak-base/Dockerfile` | New — base image (to be published) |
| `dockerfiles/vite_oak/Dockerfile` | New — dev image for docker-compose |
| `docker-compose.yml` | Add `oak_fe`; update `oak_proxy` volumes and links |
| `docker_volumes/static/` | New volume (Vite output + proxy overlay) |
| `docker_volumes/node_modules/` | New volume (node_modules cache) |
| `docker_volumes/proxy_configuration/configure.php` | Add `require_once` for `frontend.php` |
| `docker_volumes/proxy_configuration/rules/frontend.php` | New — tent rules for React assets |
| `docker_volumes/proxy_configuration/rules/backend.php` | Narrow from catch-all to JSON API only |
| `.circleci/config.yml` | Add `frontend-checks`, `jasmine`, `upload_fe_files` jobs |
| `source/app/assets/` | Remove AngularJS/Cyberhawk assets (Step 8) |
| `source/app/views/` | Remove HTML-only ERB templates (Step 8) |
| `source/app/controllers/concerns/one_page_application.rb` | Remove (Step 8) |
