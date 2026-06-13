# Plan: Handle Redirects in the Proxy

## Overview

Add a redirect rule to the Tent proxy configuration so that bare `GET` requests (non-asset, non-JSON) are redirected to `/#/path` at the proxy level, avoiding an unnecessary round-trip to Rails.

## Context

Oak's proxy (`docker_volumes/proxy_configuration/`) currently loads `frontend.php` and `backend.php` but has no `redirects.php`. Requests like `GET /categories` fall through to Rails, which redirects via the `OnePageApplication` concern. The redirect should happen at the proxy instead.

The `majora` project (`/Users/darthjee/projetos/mine/majora/docker_volumes/proxy_configuration/rules/redirects.php`) already implements this pattern and serves as the reference implementation.

## Implementation Steps

### Step 1 — Create `rules/redirects.php`

Create `docker_volumes/proxy_configuration/rules/redirects.php` modelled on the `majora` reference. The rule must:

- Match `GET` requests whose path matches `/^\/(?!#\/)/` (any path not already starting with `/#/`).
- Apply `Tent\Middlewares\RedirectMiddleware` to rewrite `/path` → `/#/path`, preserving the query string.
- Use `default_proxy` pointing at `http://backend:3000` (Oak's backend host, matching `backend.php`).

```php
<?php

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'type' => 'default_proxy',
        'host' => 'http://backend:3000',
        'skip_cache_header' => 'X-Skip-Cache'
    ],
    'matchers' => [
        ['method' => 'GET', 'pattern' => '/^\/(?!#\/)/', 'type' => 'regex'],
    ],
    'middlewares' => [
        [
            'class' => 'Tent\Middlewares\RedirectMiddleware',
            'pattern' => '/^(\/.*)$/',
            'replacement' => '/#$1'
        ]
    ]
]);
```

### Step 2 — Update `configure.php`

Add `require_once __DIR__ . '/rules/redirects.php';` as the **last** line in `configure.php`, after `frontend.php` and `backend.php`, so those rules always take precedence.

## Files to Change

- `docker_volumes/proxy_configuration/rules/redirects.php` — new file with the catch-all redirect rule
- `docker_volumes/proxy_configuration/configure.php` — add `require_once` for `redirects.php` at the end

## Notes

- The backend host in Oak is `http://backend:3000` (not `http://backend:8080` as in `majora`) — must match `backend.php`.
- The rule is a catch-all: it deliberately runs last so frontend and backend rules always win.
- Query strings are preserved automatically by `RedirectMiddleware` (the pattern matches only the path).
- No Rails changes are needed; `OnePageApplication` can remain as a fallback.
