<?php
/**
 * Submit step of the photo upload flow (see docs/agents/photo_upload/contracts.md).
 *
 * Routed to the custom PhotoSubmitRequestHandler (proxy/extension/) instead of
 * one of Tent's built-in handlers, since none of them can parse
 * multipart/form-data or write a file to disk.
 */

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'class'              => 'Oak\Proxy\PhotoSubmitRequestHandler',
        'host'               => 'http://backend:3000',
        'photosPath'         => '/tmp/photos',
        'maxUploadSizeBytes' => (int) getenv('OAK_PHOTO_MAX_UPLOAD_SIZE_BYTES')
    ],
    'matchers' => [
        [
            'method'  => 'POST',
            'pattern' => '#^/uploads/categories/[^/]+/items/\d+/photos/\d+/submit/?$#',
            'type'    => 'regex'
        ]
    ]
]);
