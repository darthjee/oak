<?php
/**
 * Backend routing rules.
 * Proxies JSON requests to $backendHost (set in locals.php).
 */

use Tent\Configuration;

Configuration::buildRule([
    'handler' => [
        'type'              => 'default_proxy',
        'host'              => $backendHost,
        'skip_cache_header' => 'X-Skip-Cache'
    ],
    'matchers' => [
        ['uri' => '.json', 'type' => 'ends_with']
    ]
]);
