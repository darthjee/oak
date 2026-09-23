# Examples

PHP and CircleCI snippets for the production photo guide (#328). The
CircleCI jobs (#330, #331) match `.circleci/config.yml`; the rest are
proposals for the remaining sub-issues; adjust names and values when you
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
          command: bin/deploy_frontend.sh generate_key_file
      - run:
          name: Upload proxy files
          command: SOURCE=/var/www/html/ bin/deploy_frontend.sh upload
      - run:
          name: Upload proxy configuration
          command: SOURCE=proxy/prod_configuration/ DEPLOY_PATH=configuration/ bin/deploy_frontend.sh upload
      - run:
          name: Setup locals
          command: TARGET=configuration/locals.php DEPLOY_PATH=configuration bin/deploy_frontend.sh copy_files
      - run:
          name: Upload proxy extension
          command: SOURCE=proxy/extension/ DEPLOY_PATH=extension/ bin/deploy_frontend.sh upload
```

## `link_photos` job

```yaml
  link_photos:
    docker:
      - image: darthjee/tent:0.10.4
    working_directory: /home/app/app
    steps:
      - checkout
      - run:
          name: Generate key file
          command: bin/deploy_frontend.sh generate_key_file
      - run:
          name: Generate folder
          command: bin/deploy_frontend.sh generate_folder
      - run:
          name: Link photos
          command: SOURCE=$REMOTE_HOME/photos/photos DEPLOY_PATH=photos bin/deploy_frontend.sh link
      - run:
          name: Link snaps
          command: SOURCE=$REMOTE_HOME/photos/snaps DEPLOY_PATH=snaps bin/deploy_frontend.sh link
```

## Workflow

```yaml
      - link_photos:
          requires: [test, checks, jasmine, frontend-checks]
          filters:
            tags:
              only: /\d+\.\d+\.\d+/
            branches:
              ignore: /.*/
      - release:
          requires:
            - build-and-release
            - upload_proxy_files
            - upload_fe_files
            - link_photos
            # ... image releases unchanged
```
