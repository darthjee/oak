<?php
/**
 * Photo delete rule.
 * Routes DELETE .../photos/:id to the custom PhotoDeleteRequestHandler
 * (proxy/extension/), which removes the origin, photo and snap files under
 * $storageRoot and notifies $backendHost (both set in locals.php).
 */

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'class'       => 'Oak\Proxy\PhotoDeleteRequestHandler',
        'host'        => $backendHost,
        'storageRoot' => $storageRoot
    ],
    'matchers' => [
        [
            'method'  => 'DELETE',
            'pattern' => '#^/uploads/categories/[^/]+/items/\d+/photos/\d+/?$#',
            'type'    => 'regex'
        ]
    ]
]);
