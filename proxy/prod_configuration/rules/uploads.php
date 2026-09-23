<?php
/**
 * Photo upload submit rule.
 * Routes POST .../photos/:id/submit to the custom PhotoSubmitRequestHandler
 * (proxy/extension/), which stores the file under $storageRoot and notifies
 * $backendHost (both set in locals.php, as is $maxUploadSizeBytes).
 */

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'class'              => 'Oak\Proxy\PhotoSubmitRequestHandler',
        'host'               => $backendHost,
        // #335 switches this to a `storageRoot` handler option.
        'photosPath'         => $storageRoot . '/origin',
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
