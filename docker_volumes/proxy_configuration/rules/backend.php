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
        ['method' => 'GET', 'uri' => '.json', 'type' => 'ends_with'],
        ['method' => 'POST', 'uri' => '.json', 'type' => 'ends_with'],
        ['method' => 'PUT', 'uri' => '.json', 'type' => 'ends_with'],
        ['method' => 'PATCH', 'uri' => '.json', 'type' => 'ends_with'],
        ['method' => 'DELETE', 'uri' => '.json', 'type' => 'ends_with']
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
