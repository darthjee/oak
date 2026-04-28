# Plan: Use Navi to Warm Up Cache

## Overview

Add a `warm-up-cache` CircleCI job that runs immediately after `release` and uses `darthjee/navi-hey` to pre-populate the proxy cache for all public-facing resources.

## Context

The deployment process clears the proxy cache (darthjee/tent) on the `release` step. Without a warm-up, the first real users after a deploy hit cold-cache responses, increasing load on Rails and degrading performance.

Navi is configured via a file inside `.circleci/` and executed by the `darthjee/navi-hey` Docker image. It discovers individual resource slugs/IDs dynamically from listing endpoints before fetching each resource's full set of URLs.

## Implementation Steps

### Step 1 — Create the navi configuration file

Create `.circleci/navi_warm_up.yml` (or equivalent format per `docs/agents/HOW_TO_USE_NAVI.md`) defining the full list of URLs to warm up:

**Base (every page):**
- `/`
- `/?ajax=true`
- `/user/categories.json`

**Resource: `categories` (listing):**
- `/categories.json`
- `/categories`
- `/#/categories`
- `/categories?ajax=true`

**Resource: `category` (single — discovered from `/categories.json` → `slug`):**
- `/categories/{slug}.json`
- `/categories/{slug}`
- `/#/categories/{slug}`
- `/categories/{slug}?ajax=true`

**Resource: `category_items` (discovered from `/categories.json` → `slug` as `category_slug`):**
- `/categories/{category_slug}/items.json`
- `/categories/{category_slug}/items`
- `/#/categories/{category_slug}/items`
- `/categories/{category_slug}/items?ajax=true`

**Resource: `category_item` (discovered from `/categories/{slug}/items.json` → `id` + `category_slug`):**
- `/categories/{category_slug}/items/{id}.json`
- `/categories/{category_slug}/items/{id}`
- `/#/categories/{category_slug}/items/{id}`
- `/categories/{category_slug}/items/{id}?ajax=true`

**Resource: `kinds` (listing):**
- `/kinds.json`
- `/kinds`
- `/#/kinds`
- `/kinds?ajax=true`

**Resource: `kind` (single — discovered from `/kinds.json` → `slug`):**
- `/kinds/{slug}.json`
- `/kinds/{slug}`
- `/#/kinds/{slug}`
- `/kinds/{slug}?ajax=true`

### Step 2 — Add the `warm-up-cache` job to `.circleci/config.yml`

Add a new job `warm-up-cache` that:
- Uses the `darthjee/navi-hey` Docker image
- Checks out the repository (to access the navi config file in `.circleci/`)
- Runs navi pointing at the production URL and the config file

### Step 3 — Wire the job into the release workflow

In the `workflows` section of `.circleci/config.yml`, add `warm-up-cache` after `release`:

```yaml
- warm-up-cache:
    requires: [release]
    filters:
      tags:
        only: /\d+\.\d+\.\d+/
      branches:
        ignore: /.*/
```

## Files to Change

- `.circleci/navi_warm_up.yml` — new navi configuration file listing all URLs to warm up
- `.circleci/config.yml` — add `warm-up-cache` job definition and wire it into the workflow after `release`

## Notes

- The exact format of the navi configuration file depends on `docs/agents/HOW_TO_USE_NAVI.md` — needs to be confirmed before implementation.
- The production URL must be available to the job (likely via an environment variable already set in CircleCI).
- The navi config filename and format may differ from `.yml` depending on what `darthjee/navi-hey` expects.
