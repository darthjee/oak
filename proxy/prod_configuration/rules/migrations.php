<?php
/**
 * Legacy photo migration rule.
 * Routes POST /migrations/photos?limit=N to the custom
 * PhotoMigrationRequestHandler (proxy/extension/), which moves the logged-in
 * user's legacy photos/ and snaps/ files under $legacyRoot to the names
 * assigned by $backendHost, under $storageRoot (all set in locals.php).
 *
 * $legacyRoot falls back to $storageRoot, so a server whose locals.php does
 * not define it yet keeps working (both currently point to the same folder).
 */

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'class'       => 'Oak\Proxy\PhotoMigrationRequestHandler',
        'host'        => $backendHost,
        'storageRoot' => $storageRoot,
        'legacyRoot'  => $legacyRoot ?? $storageRoot
    ],
    'matchers' => [
        [
            'method'  => 'POST',
            'pattern' => '#^/migrations/photos/?$#',
            'type'    => 'regex'
        ]
    ]
]);
