# Examples

PHP and CircleCI snippets for the production photo guide (#328). They are
proposals for sub-issues #330–#332; adjust names and values when you
implement them.

## `locals.php.sample`

```php
<?php

// Copy to locals.php on the server. locals.php is git-ignored.
$backendHost        = 'https://<render-service>.onrender.com';
$storageRoot        = '/home/<user>/photos';
$staticRoot         = '/home/<user>/<site dir>';
$maxUploadSizeBytes = 10 * 1024 * 1024;
```

## `configure.php`

```php
<?php

require_once __DIR__ . '/locals.php';

require_once __DIR__ . '/rules/frontend.php';
require_once __DIR__ . '/rules/photos.php';
require_once __DIR__ . '/rules/uploads.php';
require_once __DIR__ . '/rules/deletes.php';
require_once __DIR__ . '/rules/backend.php';
require_once __DIR__ . '/rules/redirects.php';
```

## Static photo rules

`CacheControlMiddleware` is not built into Tent; see
[Proxy Rules](proxy-rules.md#static-photo-rules).

```php
<?php

use Tent\Configuration;

foreach (['/photos', '/snaps'] as $prefix) {
    Configuration::buildRule([
        'handler' => [
            'type'     => 'static',
            'location' => $staticRoot
        ],
        'matchers' => [
            ['method' => 'GET', 'uri' => $prefix, 'type' => 'begins_with'],
        ],
        'middlewares' => [
            [
                'class'         => 'Tent\\Middlewares\\CacheControlMiddleware',
                'maxAgeSeconds' => 60 * 60 * 24 * 7
            ]
        ]
    ]);
}
```

## Upload rule

```php
<?php

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'class'              => 'Oak\Proxy\PhotoSubmitRequestHandler',
        'host'               => $backendHost,
        'photosPath'         => $storageRoot . '/origin', // #335: 'storageRoot' => $storageRoot
        'maxUploadSizeBytes' => $maxUploadSizeBytes
    ],
    'matchers' => [
        [
            'method'  => 'POST',
            'pattern' => '#^/uploads/categories/[^/]+/items/\d+/photos/\d+/submit/?$#',
            'type'    => 'regex'
        ]
    ]
]);
```

The delete rule is the same shape, with `PhotoDeleteRequestHandler`, no
`maxUploadSizeBytes`, and the `DELETE` matcher from `deletes.php`.

## `upload_proxy_files` job

```yaml
  upload_proxy_files:
    docker:
      - image: darthjee/tent:0.10.4
    working_directory: /home/app/app
    steps:
      - checkout
      - run:
          name: Generate key file
          command: deploy_frontend.sh generate_key_file
      - run:
          name: Upload Tent files
          command: SOURCE=/var/www/html/ deploy_frontend.sh upload
      - run:
          name: Upload prod configuration
          command: SOURCE=/home/app/app/proxy/prod_configuration/ SSH_REMOTE_TEMP_DIR=$SSH_REMOTE_TEMP_DIR/configuration/ deploy_frontend.sh upload
      - run:
          name: Setup locals
          command: TARGET=configuration/locals.php SSH_REMOTE_TEMP_DIR=$SSH_REMOTE_TEMP_DIR/configuration deploy_frontend.sh copy_files
      - run:
          name: Upload extension
          command: SOURCE=/home/app/app/proxy/extension/ SSH_REMOTE_TEMP_DIR=$SSH_REMOTE_TEMP_DIR/extension/ deploy_frontend.sh upload
```

Check how `upload` and `copy_files` build the remote path in the image's
`deploy_frontend.sh` before relying on these variable overrides.

## `link_photos` job

```yaml
  link_photos:
    docker:
      - image: darthjee/tent:0.10.4
    steps:
      - run:
          name: Generate key file
          command: deploy_frontend.sh generate_key_file
      - run:
          name: Link photos
          command: SOURCE=$REMOTE_HOME/photos/photos TARGET=$SSH_REMOTE_TEMP_DIR/photos deploy_frontend.sh link
      - run:
          name: Link snaps
          command: SOURCE=$REMOTE_HOME/photos/snaps TARGET=$SSH_REMOTE_TEMP_DIR/snaps deploy_frontend.sh link
```

## Workflow changes

```yaml
      - link_photos:
          requires: [upload_proxy_files]
          filters: # same tag-only filters as upload_proxy_files
      - release:
          requires:
            - build-and-release
            - upload_proxy_files
            - link_photos
            - upload_fe_files
            # ... image releases unchanged
```
