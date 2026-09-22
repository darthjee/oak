# Plan: Harden apt-get install line in vite_oak-base Dockerfile (Hadolint DL3008 + DL3015)

Issue: [313-harden-apt-get-install-line-in-vite-oak-base-dockerfile-hadolint-dl3008-dl3015.md](../../issues/313-harden-apt-get-install-line-in-vite-oak-base-dockerfile-hadolint-dl3008-dl3015.md)

## Overview

Codacy's Hadolint check flags `dockerfiles/vite_oak-base/Dockerfile:5` for installing `rsync` without pinning its version (DL3008) and without `--no-install-recommends` (DL3015). Pin the exact version available on the current base image and add the flag, resolving both findings.

## Context

- The line lives in the `base` stage of `dockerfiles/vite_oak-base/Dockerfile`, which both the `builder` and final stages build `FROM base`, so the fix only needs to be made once.
- The base image `darthjee/node:0.2.1` is Debian 12 ("bookworm"). `apt-cache policy rsync` against it resolves candidate `3.2.7-1+deb12u6` (from `bookworm/main`; `bookworm-security` currently offers `3.2.7-1+deb12u5`).
- `apt-cache show rsync` lists no `Recommends`, only hard `Depends`/`Pre-Depends`, so `--no-install-recommends` is a safe no-op for `rsync` specifically today — still required to satisfy DL3015 and to guard against future recommends.
- No dedicated CI job runs Hadolint locally (`.circleci/config.yml` has no Hadolint/Dockerfile step) — the findings come from Codacy's own static analysis running against the repo, not a local command.

## Implementation Steps

### Step 1 — Pin the rsync version and add --no-install-recommends

In `dockerfiles/vite_oak-base/Dockerfile:5`, change:

```dockerfile
RUN apt-get update && apt-get install -y rsync && rm -rf /var/lib/apt/lists/*
```

to:

```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends rsync=3.2.7-1+deb12u6 && rm -rf /var/lib/apt/lists/*
```

Before committing, re-run `apt-cache policy rsync` inside the current `darthjee/node:0.2.1` base image (`docker run --rm -u root darthjee/node:0.2.1 bash -c "apt-get update -qq && apt-cache policy rsync"`) to confirm `3.2.7-1+deb12u6` is still the candidate at implementation time — pick whatever candidate version it reports if it has since changed. Then build the image (`docker build -f dockerfiles/vite_oak-base/Dockerfile .` or via `docker-compose build`) to confirm it still succeeds.

## Files to Change

- `dockerfiles/vite_oak-base/Dockerfile` — pin `rsync`'s version and add `--no-install-recommends` on the `apt-get install` line.

## Notes

- This is a hard version pin, not a floating one: it will need a manual bump whenever Debian ships a further `rsync` security update on bookworm (e.g. a future `+deb12u7`), since an unattended rebuild could otherwise fail once the pinned build is superseded/pruned from the mirror. This tradeoff was chosen deliberately over leaving the version unpinned with a Hadolint ignore comment.
- No specialist agent in this repo owns `dockerfiles/` (backend covers `source/`, frontend covers `frontend/`, proxy covers `proxy/`/`docker_volumes/proxy_configuration/`), so this plan has no agent split.
