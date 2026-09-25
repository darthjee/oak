<?php

use Tent\Configuration;

$devRules = [
    [
        'handler' => [
            'type' => 'proxy',
            'host' => 'http://frontend:8080'
        ],
        'matchers' => [
            ['method' => 'GET', 'uri' => '/', 'type' => 'exact'],
            ['method' => 'GET', 'uri' => '/assets/js/', 'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/assets/css/', 'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/assets/images/', 'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/@vite/', 'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/node_modules/', 'type' => 'begins_with'],
            ['method' => 'GET', 'uri' => '/@react-refresh', 'type' => 'exact'],
        ]
    ]
];

$staticRules = [
    [
        'handler' => [
            'type' => 'static',
            'location' => '/var/www/html/static'
        ],
        'matchers' => [
            ['method' => 'GET', 'uri' => '/assets', 'type' => 'begins_with'],
        ]
    ],
    [
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
    ]
];

$rules = getenv('FRONTEND_DEV_MODE') === 'true' ? $devRules : $staticRules;

foreach ($rules as $rule) {
    Configuration::buildRule($rule);
}
