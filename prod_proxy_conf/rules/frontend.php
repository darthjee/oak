<?php

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'type' => 'static',
        'location' => '/var/www/html/static'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/assets', 'type' => 'begins_with'],
    ]
]);

Configuration::buildRule([
    'handler' => [
        'type' => 'static',
        'location' => '/var/www/html/static'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/', 'type' => 'exact'],
    ],
    'middlewares' => [
        [
            'class' => 'Tent\Middlewares\SetPathMiddleware',
            'path' => '/index.html'
        ]
    ]
]);
