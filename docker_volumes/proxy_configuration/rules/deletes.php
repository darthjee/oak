<?php
/**
 * Deletion step of the photo upload flow (see
 * docs/agents/issues/264-proxy-photo-deletion-route-and-handler.md).
 *
 * Routed to the custom PhotoDeleteRequestHandler (proxy/extension/) since
 * the actual file unlink must happen where the photos volume is mounted
 * (the proxy container), not in the Rails backend.
 */

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'class'      => 'Oak\Proxy\PhotoDeleteRequestHandler',
        'host'       => 'http://backend:3000',
        // #335 switches this to a `storageRoot` handler option.
        'photosPath' => '/tmp/photos/origin'
    ],
    'matchers' => [
        [
            'method'  => 'DELETE',
            'pattern' => '#^/uploads/categories/[^/]+/items/\d+/photos/\d+/?$#',
            'type'    => 'regex'
        ]
    ]
]);
