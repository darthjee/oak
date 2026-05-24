# Proxy Configuration Plan

Step 5 of [plan.md](plan.md). Update the tent proxy configuration to route requests to the React front-end.

Reference: `../weave/docker_volumes/proxy_configuration/`.

---

## New file: `docker_volumes/proxy_configuration/rules/frontend.php`

Mirror of `../weave/docker_volumes/proxy_configuration/rules/frontend.php`.

When `FRONTEND_DEV_MODE=true`, tent proxies to the live Vite dev server — no caching, HMR works.
When `FRONTEND_DEV_MODE=false`, tent serves pre-built static files from `/var/www/html/static`.

```php
<?php

use Tent\Configuration;
use Tent\Handlers\ProxyRequestHandler;
use Tent\Handlers\StaticFileHandler;
use Tent\Models\Server;
use Tent\Models\RequestMatcher;

if (getenv('FRONTEND_DEV_MODE') === 'true') {
    Configuration::buildRule([
        'handler' => [
            'type' => 'proxy',
            'host' => 'http://frontend:8080'
        ],
        'matchers' => [
            ['method' => 'GET', 'uri' => '/',               'type' => 'exact'],
            ['method' => 'GET', 'uri' => '/assets/js/',     'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/assets/css/',    'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/@vite/',         'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/node_modules/',  'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/@react-refresh', 'type' => 'exact'],
        ]
    ]);
} else {
    Configuration::buildRule([
        'handler' => [
            'type' => 'static',
            'location' => '/var/www/html/static'
        ],
        'matchers' => [
            ['method' => 'GET', 'uri' => '/assets', 'type' => 'begins_with'],
        ]
    ]);
    Configuration::buildRule([
        'handler' => [
            'type' => 'static',
            'location' => '/var/www/html/static'
        ],
        'matchers' => [
            ['method' => 'GET', 'uri' => '/', 'type' => 'exact'],
        ],
        'middlewares' => [
            [
                'class' => 'Tent\Middlewares\SetPathMiddleware',
                'path' => '/index.html'
            ]
        ]
    ]);
}
```

---

## Update: `docker_volumes/proxy_configuration/configure.php`

Add `require_once` for `frontend.php` **before** `backend.php` so frontend routes match first:

```php
<?php

use Tent\Configuration;
use Tent\Models\Rule;
use Tent\Handlers\FixedFileHandler;
use Tent\Handlers\ProxyRequestHandler;
use Tent\Handlers\StaticFileHandler;
use Tent\Models\Server;
use Tent\Models\FolderLocation;
use Tent\Models\RequestMatcher;

require_once __DIR__ . '/rules/frontend.php';
require_once __DIR__ . '/rules/backend.php';
```

---

## Update: `docker_volumes/proxy_configuration/rules/backend.php`

The current rule uses `begins_with '/'` as a catch-all, which intercepts everything including HTML navigation. Narrow it to JSON API requests only so React Router can handle client-side navigation.

The Rails JSON endpoints use `.json` suffix (e.g., `/categories.json`, `/items/1.json`). Update the matcher accordingly:

```php
<?php

use Tent\Configuration;
use Tent\Handlers\ProxyRequestHandler;
use Tent\Models\Server;
use Tent\Models\RequestMatcher;

Configuration::buildRule([
    'handler' => [
        'type' => 'proxy',
        'host' => 'http://backend:3000'
    ],
    'matchers' => [
        ['method' => 'GET',    'uri' => '.json', 'type' => 'ends_with'],
        ['method' => 'POST',   'uri' => '.json', 'type' => 'ends_with'],
        ['method' => 'PUT',    'uri' => '.json', 'type' => 'ends_with'],
        ['method' => 'PATCH',  'uri' => '.json', 'type' => 'ends_with'],
        ['method' => 'DELETE', 'uri' => '.json', 'type' => 'ends_with'],
    ],
    'middlewares' => [
        [
            'class' => 'Tent\Middlewares\SetHeadersMiddleware',
            'headers' => ['Host' => 'localhost']
        ]
    ]
]);
```

> **Note:** Verify the exact matcher syntax (`ends_with`) against the tent version in use (`darthjee/tent:0.5.0`). If `ends_with` is not supported, use a regex matcher or a `begins_with` on a dedicated `/api/` prefix instead.

---

## How the rules interact

In dev mode, a request for `GET /` is matched by `frontend.php` first and proxied to Vite. A request for `GET /categories.json` falls through the frontend rules (none match `.json` URIs) and is handled by `backend.php`. In non-dev mode, `GET /` is served as `index.html` from `static/`, and navigation to `/categories` is handled client-side by React Router.
