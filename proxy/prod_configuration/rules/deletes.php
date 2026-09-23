<?php
/**
 * Photo delete rule.
 * Routes DELETE .../photos/:id to the custom PhotoDeleteRequestHandler
 * (proxy/extension/), which removes the file under $storageRoot and notifies
 * $backendHost (both set in locals.php).
 */

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'class'      => 'Oak\Proxy\PhotoDeleteRequestHandler',
        'host'       => $backendHost,
        // #335 switches this to a `storageRoot` handler option.
        'photosPath' => $storageRoot . '/origin'
    ],
    'matchers' => [
        [
            'method'  => 'DELETE',
            'pattern' => '#^/uploads/categories/[^/]+/items/\d+/photos/\d+/?$#',
            'type'    => 'regex'
        ]
    ]
]);
