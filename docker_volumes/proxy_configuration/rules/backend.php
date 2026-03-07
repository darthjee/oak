<?php

use Tent\Configuration;
use Tent\Models\Rule;
use Tent\Handlers\ProxyRequestHandler;
use Tent\Models\Server;
use Tent\Models\RequestMatcher;

Configuration::buildRule([
    'handler' => [
        'type' => 'default_proxy',
        'host' => 'http://backend:3000'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/', 'type' => 'begins_with']
    ],
    "middlewares" => [
        [
            'class' => 'Tent\Middlewares\SetHeadersMiddleware',
            'headers' => [
                'Host' => 'localhost'
            ]
        ]
    ]
]);
