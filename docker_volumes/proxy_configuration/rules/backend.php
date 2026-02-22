<?php

use Tent\Configuration;
use Tent\Models\Rule;
use Tent\Handlers\ProxyRequestHandler;
use Tent\Models\Server;
use Tent\Models\RequestMatcher;

Configuration::buildRule([
    'handler' => [
        'type' => 'proxy',
        'host' => 'http://backend:3000'
    ],
    'matchers' => [
        ['method' => 'GET', 'uri' => '/', 'type' => 'begins_with']
    ],
    "middlewares" => [
        [
            'class' => 'Tent\Middlewares\FileCacheMiddleware',
            'location' => "./cache",
            'matchers' => [
                [
                    'class' => 'Tent\Matchers\StatusCodeMatcher',
                    'httpCodes' => ["2xx", "3xx"]
                ]
            ]
        ]
    ]
]);
