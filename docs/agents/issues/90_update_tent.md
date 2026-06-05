# Issue: Update Tent

## Description

Tent must be upgraded to at least version 0.7.4 in both `docker-compose.yml` and `.circleci/config.yml`. This version introduces the `skip_cache_header` option, which allows the proxy to bypass the file cache for specific requests based on a request header.

## Problem

- The current version of tent does not support skipping the cache per-request.
- Logged-in users receive cached responses meant for anonymous users, causing stale or incorrect content — including the logoff flow not reflecting the logged-out state properly.

## Expected Behavior

- When a user is logged in, all their requests must bypass the proxy cache.
- The backend sets a header (e.g., `X-Skip-Cache`) on responses for authenticated sessions, and the proxy skips both reading from and writing to the cache for those requests.

## Solution

1. Upgrade tent to `>= 0.7.4` in `docker-compose.yml` and `.circleci/config.yml`.
2. Configure the proxy rules to use `skip_cache_header`:

```php
Configuration::buildRule([
    'handler' => [
        'type'              => 'default_proxy',
        'host'              => 'http://backend:3010',
        'cache'             => './cache',
        'cacheCodes'        => ['2xx'],
        'skip_cache_header' => 'X-Skip-Cache'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/', 'type' => 'begins_with']
    ]
]);
```

3. Add Rails middleware or a `before_action` in `ApplicationController` to inject the `X-Skip-Cache` header on all responses for logged-in users.

## Benefits

- Logged-in users always see fresh, personalized content.
- Anonymous users continue to benefit from proxy caching for performance.
- Fixes the logoff cache issue where the logged-in header state was served from cache after logout.

---
See issue for details: https://github.com/darthjee/oak/issues/90
