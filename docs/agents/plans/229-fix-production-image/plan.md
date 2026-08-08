# Plan: Fix production image

Issue: [229-fix-production-image.md](../issues/229-fix-production-image.md)

## Overview

The production Docker image build has been broken since commit `54667cdc181b31b7b6fff869ca01812f4365afd3` removed the old AngularJS/Sprockets frontend but left the Docker/CI pipeline still trying to build it. This plan removes every leftover: the dead `yarn install`/`assets:precompile` steps in the production Dockerfiles, the now-unused `importmap-rails`/`stimulus-rails`/`turbo-rails`/`turbolinks` gems and legacy `source/package.json`, and the dead `yarn install` step in CircleCI's `test` job — plus a version bump for `production_oak-base` since its Dockerfile changes.

## Context

- Reproduced locally: `docker build -f dockerfiles/production_oak/Dockerfile source` fails with `Unrecognized command "assets:precompile" (Rails::Command::UnrecognizedCommandError)` — `Gemfile.lock` has no `sprockets-rails`/`propshaft` gem, so the rake task doesn't exist.
- Confirmed (via grep across `source/app` and `source/config`) that nothing references `stimulus`, `turbo_stream`, `data-controller`, `importmap`, `asset_path`, `image_tag`, or `stylesheet_link_tag`. The only views left (`source/app/views/layouts/mailer.*`) don't use asset helpers. `routes.rb` has no `/assets` route.
- Per `docs/agents/architecture.md`, Rails (`source/`) is a pure JSON API + SPA-shell server; the real frontend build lives entirely under `frontend/` via its own separate `vite_oak*` Docker pipeline — unrelated to this fix.
- `production_oak-base` is tracked in the root `version` file and released via CircleCI's `release-production_oak-base` job, which tags/pushes using whatever version is in that file regardless of whether the Dockerfile changed — so its Dockerfile change requires a version bump to avoid silently overwriting the existing `0.1.0` image tag.
- `production_oak` itself is not in `version`/not built via `bin/image.sh`'s release-image job — it's deployed separately via `scripts/deploy.sh` (`build-and-release` CircleCI job), so it needs no version bump.

## Implementation Steps

### Step 1 — Strip dead asset-pipeline steps from `dockerfiles/production_oak/Dockerfile`

Remove:
```
RUN yarn install
RUN RAILS_ENV=production rails assets:precompile
RUN rm /home/app/app/assets -rf
RUN rm /home/app/app/vendor/assets -rf
RUN rm /home/app/app/node_modules -rf
```
These `rm` lines exist only to clean up after the precompile step; with it gone there's nothing to clean up (`app/assets` now only holds `images/`, which should stay; there's no `node_modules` to remove since `yarn install` no longer runs). Keep the `rm public/assets/*`, `rm log/*`, `rm tmp/*`, `rm spec`, `rm master.key`/`credentials.yml.enc` lines — those are unrelated to the old frontend.

Verify: `docker build -f dockerfiles/production_oak/Dockerfile source` completes successfully (already confirmed working with this exact change during the issue investigation).

### Step 2 — Strip dead yarn-cache steps from `dockerfiles/production_oak-base/Dockerfile`

Remove the `COPY package.json /home/app/app/` line and the `yarn_builder.sh` invocation (and its supporting `COPY --from=scripts .../yarn_builder.sh` line) — these exist only to seed a yarn cache layer for the legacy `source/package.json`, which Step 4 deletes anyway. Keep the `Gemfile*` COPY and `bundle_builder.sh` steps — those are still needed.

### Step 3 — Bump `production_oak-base` version

In the root `version` file, bump:
```
production_oak-base=0.1.0
```
to
```
production_oak-base=0.1.1
```
Update the matching `FROM darthjee/production_oak-base:0.1.0` tag in `dockerfiles/production_oak/Dockerfile` to `0.1.1` to match.

### Step 4 — Remove unused Gemfile gems and legacy frontend files

In `source/Gemfile`, remove:
```
gem 'importmap-rails'
gem 'stimulus-rails'
gem 'turbolinks', '>= 5.2.1'
gem 'turbo-rails'
```
Run `bundle install` inside `source/` to regenerate `Gemfile.lock` and commit the updated lockfile.

Delete:
- `source/package.json` (legacy AngularJS/jQuery/Bootstrap-4 deps)
- `source/config/importmap.rb` (unused importmap pin config, orphaned once `importmap-rails` is removed)

Also delete `source/yarn.lock` and `source/package-lock.json` if present, since there's no more `package.json` for them to lock against, and any local `source/node_modules` (already gitignored, but clean up locally if present).

### Step 5 — Remove dead CI step

In `.circleci/config.yml`, remove the `Yarn Install` step (`command: cd source && yarn install`) from the `test` job — it installed the same now-deleted legacy `source/package.json` deps and served no purpose (the `test` job's actual work — `bundle install`, DB migrate, `rspec` — never depended on it).

## Files to Change

- `dockerfiles/production_oak/Dockerfile` — remove dead `yarn install`/`assets:precompile`/cleanup `RUN` lines; bump base image tag to `0.1.1`.
- `dockerfiles/production_oak-base/Dockerfile` — remove dead `package.json` COPY and `yarn_builder.sh` steps.
- `version` — bump `production_oak-base` to `0.1.1`.
- `source/Gemfile` — remove `importmap-rails`, `stimulus-rails`, `turbo-rails`, `turbolinks`.
- `source/Gemfile.lock` — regenerate via `bundle install`.
- `source/package.json` — delete.
- `source/yarn.lock`, `source/package-lock.json` — delete if present.
- `source/config/importmap.rb` — delete.
- `.circleci/config.yml` — remove the `Yarn Install` step from the `test` job.

## CI Checks

- `source/`: `cd source && bundle install && bundle exec rspec` (CI job: `test`) — confirms the Gemfile trim doesn't break the app or specs.
- `source/`: `cd source && bundle install` then `cp source/* ./ -r && rubocop` per the `checks` job's own steps (CI job: `checks`) — confirms no rubocop regressions.
- Local: `docker build -f dockerfiles/production_oak-base/Dockerfile source` and `docker build -f dockerfiles/production_oak/Dockerfile source` — confirms both images build clean end-to-end (the second was already verified during issue investigation with the Step 1 change alone; re-verify with the full set of changes, including the bumped `FROM` tag).

## Notes

- `dockerfiles/production_oak-base/Dockerfile`'s base image (`darthjee/production_taa:1.5.0`) is pulled from a private/external registry — building it locally to verify Step 2 requires registry access; if unavailable, rely on the `release-production_oak-base` CircleCI job on the next tag push instead.
- No backward-compatibility risk: confirmed no route, controller, or view depends on Rails-served assets, importmap, stimulus, or turbo.
