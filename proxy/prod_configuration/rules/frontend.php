<?php
/**
 * Frontend routing rules.
 * Serves the built frontend from $staticRoot . '/static' (set in locals.php).
 */

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'type'     => 'static',
        'location' => $staticRoot . '/static'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/assets', 'type' => 'begins_with'],
    ]
]);

Configuration::buildRule([
    'handler' => [
        'type'     => 'static',
        'location' => $staticRoot . '/static'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/', 'type' => 'exact'],
    ],
    'middlewares' => [
        [
            'class' => 'Tent\Middlewares\SetPathMiddleware',
            'path'  => '/index.html'
        ]
    ]
]);
