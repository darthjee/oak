<?php
/**
 * Photo static file rules.
 * Serves GET /photos/... and GET /snaps/... straight from $staticRoot
 * (set in locals.php), where the release directory holds `photos` and
 * `snaps` symlinks to the persistent storage. File names contain a UUID,
 * so successful responses are cached for 7 days (see CacheControlMiddleware).
 */

use Tent\Configuration;

foreach (['/photos', '/snaps'] as $photoPrefix) {
    Configuration::buildRule([
        'handler' => [
            'type'     => 'static',
            'location' => $staticRoot
        ],
        'matchers' => [
            ['method' => 'GET', 'uri' => $photoPrefix, 'type' => 'begins_with'],
        ],
        'middlewares' => [
            [
                'class'         => 'Oak\Proxy\CacheControlMiddleware',
                'maxAgeSeconds' => 60 * 60 * 24 * 7
            ]
        ]
    ]);
}
