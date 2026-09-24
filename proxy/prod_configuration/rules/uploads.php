<?php
/**
 * Photo upload submit rule.
 * Routes POST .../photos/:id/submit to the custom PhotoSubmitRequestHandler
 * (proxy/extension/), which stores the original and its resized photo and
 * snap versions under $storageRoot (origin/, photos/, snaps/) and notifies
 * $backendHost (both set in locals.php, as is $maxUploadSizeBytes).
 */

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'class'              => 'Oak\Proxy\PhotoSubmitRequestHandler',
        'host'               => $backendHost,
        'storageRoot'        => $storageRoot,
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
