# Issue: Handle Redirects in the Proxy

## Description

The proxy configuration (`docker_volumes/proxy_configuration/`) is missing a redirect rule for non-JSON `GET` requests. Currently those requests fall through to Rails, which redirects them via the `OnePageApplication` concern. The redirect should be handled at the proxy level, avoiding an unnecessary round-trip to Rails.

## Problem

- `docker_volumes/proxy_configuration/configure.php` loads `frontend.php` and `backend.php` but has no `redirects.php`.
- Any `GET /path` that is not a frontend asset or a `.json` endpoint reaches Rails unnecessarily.
- Rails then issues a 302 to `/#/path` via `OnePageApplication`, costing an extra HTTP round-trip.

## Expected Behavior

The proxy should catch all bare `GET` requests and redirect them to `/#/path`, preserving the query string:

- `GET /categories` → `302 /#/categories`
- `GET /categories?page=2` → `302 /#/categories?page=2`

## Affected Routes

All HTML `GET` routes defined in `source/config/routes.rb` that are served by the SPA:

| Method | Path | Rails action |
|--------|------|--------------|
| GET | `/forbidden` | `static#forbidden` |
| GET | `/categories` | `index_categories#index` |
| GET | `/categories/new` | `categories#new` |
| GET | `/categories/:slug` | `categories#show` |
| GET | `/categories/:slug/edit` | `categories#edit` |
| GET | `/categories/:slug/items` | `items#index` |
| GET | `/categories/:slug/items/new` | `items#new` |
| GET | `/categories/:slug/items/:id` | `items#show` |
| GET | `/categories/:slug/items/:id/edit` | `items#edit` |
| GET | `/categories/:slug/kinds` | `category/kinds#index` |
| GET | `/kinds` | `kinds#index` |
| GET | `/kinds/new` | `kinds#new` |
| GET | `/kinds/:slug` | `kinds#show` |
| GET | `/user/categories` | `user/categories#index` |

## Solution

Model the rule after the `redirects.php` from the `majora` project:

1. Create `docker_volumes/proxy_configuration/rules/redirects.php` with a catch-all `GET` rule that applies `RedirectMiddleware` to rewrite `/path` → `/#/path`.
2. Add `require_once __DIR__ . '/rules/redirects.php';` **last** in `configure.php` so frontend and backend rules always take precedence.

### Reference implementation (`majora`)

```php
Configuration::buildRule([
    'handler' => [
        'type' => 'default_proxy',
        'host' => 'http://backend:8080'
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

## Benefits

- Reduces latency: redirects happen at the proxy without hitting Rails.
- Removes dependency on `OnePageApplication` concern for the redirect case.
- Consistent with how the `majora` project handles this pattern.

---
See issue for details: https://github.com/darthjee/oak/issues/195
