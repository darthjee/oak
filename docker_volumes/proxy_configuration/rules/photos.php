<?php
/**
 * Photo static file rules.
 * Serves GET /photos/... and GET /snaps/... from /tmp/photos (the
 * ./dev_public_files mount), which holds `photos/` and `snaps/`.
 * File names contain a UUID, so successful responses are cached for 7 days
 * (see CacheControlMiddleware).
 */

use Tent\Configuration;

foreach (['/photos', '/snaps'] as $photoPrefix) {
    Configuration::buildRule([
        'handler' => [
            'type'     => 'static',
            'location' => '/tmp/photos'
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
