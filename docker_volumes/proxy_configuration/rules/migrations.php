<?php
/**
 * Legacy photo migration rule (see
 * docs/agents/issues/381-proxy-migrations-photos-handler-moving-legacy-files.md).
 *
 * Routes POST /migrations/photos?limit=N to the custom
 * PhotoMigrationRequestHandler (proxy/extension/), which moves the logged-in
 * user's legacy photos/ and snaps/ files (under legacyRoot) to the names
 * assigned by the backend (under storageRoot), one batch per call.
 */

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'class'       => 'Oak\Proxy\PhotoMigrationRequestHandler',
        'host'        => 'http://backend:3000',
        'storageRoot' => '/tmp/photos',
        'legacyRoot'  => '/tmp/photos'
    ],
    'matchers' => [
        [
            'method'  => 'POST',
            'pattern' => '#^/migrations/photos/?$#',
            'type'    => 'regex'
        ]
    ]
]);
