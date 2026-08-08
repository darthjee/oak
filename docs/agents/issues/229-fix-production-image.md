# Issue: Fix production image

## Description

Commit `54667cdc181b31b7b6fff869ca01812f4365afd3` (Fix #102 — Remove old frontend) removed the legacy AngularJS/Sprockets frontend from `source/` (`app/assets/config/manifest.js`, `config/initializers/assets.rb`, and all `app/assets/javascripts`/`stylesheets`), since the app is now a pure JSON API + React/Vite SPA (`frontend/`) per `docs/agents/architecture.md`. That commit removed the asset pipeline's config but left the production Docker build still trying to run it, so the production image (`dockerfiles/production_oak/Dockerfile`) has been broken since that merge.

## Problem

`dockerfiles/production_oak/Dockerfile` still runs `yarn install` and `RAILS_ENV=production rails assets:precompile`, which now fails the image build:

```
ERROR: process "/bin/sh -c RAILS_ENV=production rails assets:precompile" did not complete successfully: exit code: 1
```

Reproduced locally with `docker build -f dockerfiles/production_oak/Dockerfile source`; the underlying error is:

```
Unrecognized command "assets:precompile" (Rails::Command::UnrecognizedCommandError)
```

Root cause: `Gemfile.lock` has no `sprockets-rails`/`propshaft` gem at all (also dropped when the old frontend was removed), so the `assets:precompile` rake task no longer exists — there is nothing left to precompile into.

This isn't the only leftover from the frontend removal:

- `source/package.json` still lists the old frontend's dependencies (AngularJS, jQuery, Bootstrap 4, etc.), and both `dockerfiles/production_oak/Dockerfile` (`yarn install`) and `dockerfiles/production_oak-base/Dockerfile` (`COPY package.json` + `yarn_builder.sh`) still install them into a cache layer that's never used for anything.
- The `Gemfile` still carries `importmap-rails`, `stimulus-rails`, `turbo-rails`, and `turbolinks`, none of which are referenced anywhere in `source/app` or `source/config` (checked via grep for `stimulus`, `turbo_stream`, `data-controller`, `importmap`, `asset_path`, `image_tag`, `stylesheet_link_tag` — only the unused `config/importmap.rb` scaffold and a CSP initializer default turned up). The mailer views (the only views left under `source/app/views`) don't use any asset helper, and `routes.rb` has no `/assets` route.
- CircleCI's `test` job still runs `cd source && yarn install`, installing the same unused legacy `source/package.json` deps on every test run (doesn't fail the build, just dead weight).

## Expected Behavior

`docker build -f dockerfiles/production_oak/Dockerfile source` (and `production_oak-base`) completes successfully, and the resulting production image contains no trace of the removed legacy frontend — no unused Node/yarn install step, no unused `importmap-rails`/`stimulus-rails`/`turbo-rails`/`turbolinks` gems, and no dead `yarn install` step in CI.

## Solution

Full cleanup, in three parts:

1. **Dockerfile fix** — In `dockerfiles/production_oak/Dockerfile`, drop `RUN yarn install` and `RUN RAILS_ENV=production rails assets:precompile`, along with the now-pointless `rm assets`/`rm vendor/assets`/`rm node_modules` cleanup lines that exist only to undo that build. In `dockerfiles/production_oak-base/Dockerfile`, drop the matching dead `COPY package.json` and `yarn_builder.sh` run that exist only to seed a yarn cache layer for the same unused `source/package.json`. Since `production_oak-base`'s Dockerfile is changing, bump its entry in the `version` file (`production_oak-base=0.1.0` → `0.1.1`) and update the `FROM darthjee/production_oak-base:0.1.0` tag in `dockerfiles/production_oak/Dockerfile` to match — otherwise the next tagged CI release (`release-production_oak-base`) would silently overwrite the existing `0.1.0` image on Docker Hub with different contents under the same tag.
2. **Gemfile cleanup** — Remove the unused `importmap-rails`, `stimulus-rails`, `turbo-rails`, `turbolinks` gems from `source/Gemfile` (and re-run `bundle install`/commit the updated `Gemfile.lock`), plus delete `source/package.json` and `source/config/importmap.rb`.
3. **CI cleanup** — Remove the dead `Yarn Install` step (`cd source && yarn install`) from the `test` job in `.circleci/config.yml`.

Verification: reproduced the failure locally with `docker build -f dockerfiles/production_oak/Dockerfile source` and confirmed the minimal fix (dropping just the `yarn install`/`assets:precompile` lines) builds successfully end-to-end against the same base image and `source/` context. Full verification of the final fix should rebuild both `production_oak-base` and `production_oak` locally, plus run the existing `test`/`checks`/`rubocop` CI jobs to confirm the Gemfile and CI cleanup don't break anything else.

No backward-compatibility risk: confirmed no route, controller, or view depends on Rails-served assets, importmap, stimulus, or turbo.

## Benefits

- Unblocks production image releases (currently broken since commit 54667cdc181b31b7b6fff869ca01812f4365afd3).
- Smaller, faster-building production image (no unused Node/yarn install layer).
- Reduced attack surface and dependency count (drops unused gems and legacy AngularJS/jQuery/Bootstrap-4 packages).
- Removes a source of confusion for future contributors about whether the Rails app still has an asset pipeline.
