# Issue: Use Navi to Warm Up Cache

## Description

The deployment process clears the proxy cache on the `release` step in CircleCI. Immediately after, a `warm-up-cache` step must be added to pre-populate the cache for all main resources, so users do not experience cold-cache responses after a new release.

The warm-up is performed using [navi](https://github.com/darthjee/navi) via its Docker image [`darthjee/navi-hey`](https://hub.docker.com/r/darthjee/navi-hey). Usage instructions are documented in [`docs/agents/HOW_TO_USE_NAVI.md`](../HOW_TO_USE_NAVI.md).

## Problem

- After each release, the proxy cache is empty.
- Users hitting the app immediately after a deploy get uncached responses, increasing load on Rails and degrading perceived performance.

## Expected Behavior

After the `release` step completes, a `warm-up-cache` step runs automatically in CircleCI and pre-fetches all relevant URLs for each resource, so the cache is populated before real users arrive.

## Solution

Add a `warm-up-cache` job to `.circleci/config.yml` that runs after `release` and uses `darthjee/navi-hey` to request the following URLs.

Parameters for individual resources are discovered dynamically from listing endpoints:

| Listing endpoint | Field used | Used in |
|-----------------|-----------|---------|
| `/categories.json` | `slug` | `category` URLs |
| `/categories/{:slug}/items.json` | `id` + `category_slug` | `category_item` URLs |
| `/kinds.json` | `slug` | `kind` URLs |

### Base

| URL | Purpose |
|-----|---------|
| `/` | Loads `index.html` with all JS and CSS assets |
| `/user/categories.json` | Loads the user's subscribed categories — used in the header menu on every page |

### Resource: `categories` (listing)

| URL | Type |
|-----|------|
| `/categories.json` | Data |
| `/categories` | Redirect |
| `/#/categories` | Anchor (no redirect) |
| `/categories?ajax=true` | Template |

### Resource: `category` (single)

Uses `:slug` as the identifier (not `:id`).

| URL | Type |
|-----|------|
| `/categories/{:slug}.json` | Data |
| `/categories/{:slug}` | Redirect |
| `/#/categories/{:slug}` | Anchor (no redirect) |
| `/categories/{:slug}?ajax=true` | Template |

### Resource: `category_items` (items listing inside a category)

Uses `:category_slug` as the category identifier.

| URL | Type |
|-----|------|
| `/categories/{:category_slug}/items.json` | Data |
| `/categories/{:category_slug}/items` | Redirect |
| `/#/categories/{:category_slug}/items` | Anchor (no redirect) |
| `/categories/{:category_slug}/items?ajax=true` | Template |

### Resource: `category_item` (single item)

| URL | Type |
|-----|------|
| `/categories/{:category_slug}/items/{:id}.json` | Data |
| `/categories/{:category_slug}/items/{:id}` | Redirect |
| `/#/categories/{:category_slug}/items/{:id}` | Anchor (no redirect) |
| `/categories/{:category_slug}/items/{:id}?ajax=true` | Template |

### Resource: `kinds` (listing)

| URL | Type |
|-----|------|
| `/kinds.json` | Data |
| `/kinds` | Redirect |
| `/#/kinds` | Anchor (no redirect) |
| `/kinds?ajax=true` | Template |

### Resource: `kind` (single)

| URL | Type |
|-----|------|
| `/kinds/{:slug}.json` | Data |
| `/kinds/{:slug}` | Redirect |
| `/#/kinds/{:slug}` | Anchor (no redirect) |
| `/kinds/{:slug}?ajax=true` | Template |

## Benefits

- Eliminates cold-cache penalty for users arriving right after a release.
- Reduces post-deploy spike on the Rails app.
- Consistent with the existing proxy caching strategy (darthjee/tent).

---
See issue for details: https://github.com/darthjee/oak/issues/87
