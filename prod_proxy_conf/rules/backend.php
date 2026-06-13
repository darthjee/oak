<?php

use Tent\Configuration;
use Tent\Models\Rule;
use Tent\Handlers\ProxyRequestHandler;
use Tent\Models\Server;
use Tent\Models\RequestMatcher;

Configuration::buildRule([
    'handler' => [
        'type' => 'default_proxy',
        'host' => 'https://oak-api.ffavs.net/'
    ],
    'matchers' => [
        ['uri' => '.json', 'type' => 'ends_with']
    ]
]);
