# Plan: Use Navi to Warm Up Cache

## Overview

Add a `warm-up-cache` CircleCI job that runs immediately after `release` and uses `darthjee/navi-hey` to pre-populate the proxy cache for all public-facing resources.

Two files change: the navi YAML configuration (`.circleci/navi_config.yaml`) and the CircleCI pipeline (`.circleci/config.yml`).

## Context

The deployment process clears the proxy cache (darthjee/tent) on the `release` step. Without a warm-up, the first real users after a deploy hit cold-cache responses, increasing load on Rails and degrading performance.

Navi supports **resource chaining** via `actions`: after fetching a listing endpoint it automatically enqueues individual-resource URLs using values extracted from the JSON response. This covers the dynamic slug/ID discovery without any scripting.

The recommended integration for CircleCI is **Option C** from `HOW_TO_USE_NAVI.md`: declare `darthjee/navi-hey:latest` as the job's executor image. Since `navi-hey` is installed globally in that image, no Docker-in-Docker or npm install step is needed.

## Implementation Steps

### Step 1 — Create `.circleci/navi_config.yaml`

```yaml
workers:
  quantity: 5
  retry_cooldown: 2000
  sleep: 500
  max-retries: 3

clients:
  default:
    base_url: $OAK_PRODUCTION_URL
    timeout: 5000

resources:
  home:
    - url: /
      status: 200
      assets:
        - selector: 'link[rel="stylesheet"]'
          attribute: href
        - selector: 'script[src]'
          attribute: src
    - url: /?ajax=true
      status: 200

  user_navigation:
    - url: /user/categories.json
      status: 200

  categories:
    - url: /categories.json
      status: 200
      actions:
        - resource: category
          parameters:
            slug: parsed_body.slug
        - resource: category_items
          parameters:
            category_slug: parsed_body.slug
    - url: /categories
      status: 302
    - url: /#/categories
      status: 200
    - url: /categories?ajax=true
      status: 200

  category:
    - url: /categories/{:slug}.json
      status: 200
    - url: /categories/{:slug}
      status: 302
    - url: /#/categories/{:slug}
      status: 200
    - url: /categories/{:slug}?ajax=true
      status: 200

  category_items:
    - url: /categories/{:category_slug}/items.json
      status: 200
      actions:
        - resource: category_item
          parameters:
            id: parsed_body.id
            category_slug: parsed_body.category_slug
    - url: /categories/{:category_slug}/items
      status: 302
    - url: /#/categories/{:category_slug}/items
      status: 200
    - url: /categories/{:category_slug}/items?ajax=true
      status: 200

  category_item:
    - url: /categories/{:category_slug}/items/{:id}.json
      status: 200
    - url: /categories/{:category_slug}/items/{:id}
      status: 302
    - url: /#/categories/{:category_slug}/items/{:id}
      status: 200
    - url: /categories/{:category_slug}/items/{:id}?ajax=true
      status: 200

  kinds:
    - url: /kinds.json
      status: 200
      actions:
        - resource: kind
          parameters:
            slug: parsed_body.slug
    - url: /kinds
      status: 302
    - url: /#/kinds
      status: 200
    - url: /kinds?ajax=true
      status: 200

  kind:
    - url: /kinds/{:slug}.json
      status: 200
    - url: /kinds/{:slug}
      status: 302
    - url: /#/kinds/{:slug}
      status: 200
    - url: /kinds/{:slug}?ajax=true
      status: 200
```

Key points:
- `/` uses `assets` to also warm the linked CSS and JS bundles automatically.
- Chaining: `categories` → `category` + `category_items` → `category_item`, using `slug`/`id`/`category_slug` extracted from JSON responses.
- `$OAK_PRODUCTION_URL` must be set as a CircleCI project environment variable.

### Step 2 — Add the `warm-up-cache` job to `.circleci/config.yml`

```yaml
warm-up-cache:
  docker:
    - image: darthjee/navi-hey:latest
  steps:
    - checkout
    - run:
        name: Warm up proxy cache
        command: navi-hey --config .circleci/navi_config.yaml
```

### Step 3 — Wire the job into the release workflow

In the `workflows` section, add `warm-up-cache` after `release`:

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

- `.circleci/navi_config.yaml` — new file; full navi configuration with all resources and chaining
- `.circleci/config.yml` — add `warm-up-cache` job and wire it into the workflow after `release`

## Notes

- `$OAK_PRODUCTION_URL` must be defined as a CircleCI project/context environment variable before this job can run (e.g. `https://oak.example.com`).
- The `home` resource uses `assets` extraction — navi will parse the HTML from `/` and automatically enqueue all `<link rel="stylesheet">` and `<script src>` URLs for warming.
- Redirect URLs (`/categories`, `/kinds`, etc.) are expected to return `302`. If the proxy or load balancer returns a different code, the `status` values may need adjusting.
- `user_navigation` is a standalone resource (not chained from anything) — it is always fetched regardless of login state, returning all categories for anonymous users.

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `.circleci/`: no local CI command — changes are validated by the CircleCI pipeline itself on push.
