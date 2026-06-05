# Plan: Update Tent

## Overview

Upgrade the `darthjee/tent` proxy from `0.7.2` to `0.7.4` and wire up the `skip_cache_header` feature so that logged-in users always bypass the proxy cache. This prevents session-specific JSON responses (login state, user categories) from being served as cached responses to other users, and prevents logoff from appearing stuck due to a cached header.

## Context

- The proxy (`darthjee/tent`) is pinned at `0.7.2` in both `docker-compose.yml` and `.circleci/config.yml`.
- The backend proxy rule in `docker_volumes/proxy_configuration/rules/backend.php` uses `default_proxy`, which enables file caching by default.
- Tent `0.7.4` adds `skip_cache_header`: when a request contains the named header, the proxy skips both reading from and writing to the cache for that request.
- The Rails app needs to set this header (`X-Skip-Cache`) on all responses when the user is logged in.

## Implementation Steps

### Step 1 — Bump tent version

Update the image tag from `darthjee/tent:0.7.2` to `darthjee/tent:0.7.4` in two files:
- `docker-compose.yml` (line 122)
- `.circleci/config.yml` (line 173, `upload_proxy_files` job)

### Step 2 — Add `skip_cache_header` to the backend proxy rule

In `docker_volumes/proxy_configuration/rules/backend.php`, add `skip_cache_header` to the `default_proxy` handler:

```php
Configuration::buildRule([
    'handler' => [
        'type'              => 'default_proxy',
        'host'              => 'http://backend:3000',
        'skip_cache_header' => 'X-Skip-Cache'
    ],
    'matchers' => [
        ['uri' => '.json', 'type' => 'ends_with']
    ],
    'middlewares' => [
        [
            'class'   => 'Tent\Middlewares\SetHeadersMiddleware',
            'headers' => ['Host' => 'localhost']
        ]
    ]
]);
```

### Step 3 — Set `X-Skip-Cache` header in Rails for logged-in users

In `source/app/controllers/application_controller.rb`, add an `after_action` that sets the header whenever the session cookie is present:

```ruby
after_action :set_skip_cache_header

private

def set_skip_cache_header
  response.set_header('X-Skip-Cache', 'true') if cookies.signed[:session].present?
end
```

Using `cookies.signed[:session]` avoids an extra DB query — if the cookie exists, the user has (or recently had) a session, and cache should be bypassed. Logoff deletes the cookie, so subsequent requests from a logged-out user will not set the header and will be served from cache normally.

### Step 4 — Add spec for the new `after_action`

In `source/spec/controllers/application_controller_spec.rb` (create if needed), add a test that verifies:
- When a session cookie is present, the response includes `X-Skip-Cache: true`.
- When no session cookie is present, the header is absent.

## Files to Change

- `docker-compose.yml` — bump `darthjee/tent:0.7.2` → `0.7.4`
- `.circleci/config.yml` — bump `darthjee/tent:0.7.2` → `0.7.4` in `upload_proxy_files` job
- `docker_volumes/proxy_configuration/rules/backend.php` — add `skip_cache_header`
- `source/app/controllers/application_controller.rb` — add `after_action :set_skip_cache_header`
- `source/spec/controllers/application_controller_spec.rb` — new spec

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `source/`: `cd source && bundle exec rspec` (CircleCI job: `test`)
- `source/`: `cd source && bundle exec rubocop` (CircleCI job: `checks`)

## Notes

- `cookies.signed[:session]` uses Rails' signed cookie jar (same key used in `LoggedUser::Processor`). If the cookie is tampered, `signed` returns `nil`, so the header will not be set — safe by default.
- The proxy rule already uses `default_proxy` which enables caching; `skip_cache_header` is additive and does not change behavior for unauthenticated requests.
- The `docker_volumes/proxy_configuration/` files are deployed to production via the `upload_proxy_files` CI job, so bumping the tent version in CI and updating the rules both need to land in the same PR.
