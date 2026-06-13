<?php

use Tent\Configuration;
use Tent\Models\Rule;
use Tent\Handlers\FixedFileHandler;
use Tent\Handlers\ProxyRequestHandler;
use Tent\Handlers\StaticFileHandler;
use Tent\Models\Server;
use Tent\Models\FolderLocation;
use Tent\Models\RequestMatcher;

if (getenv('NEW_FRONTEND') === 'true') {
    require_once __DIR__ . '/rules/frontend.php';
    require_once __DIR__ . '/rules/backend.php';
    require_once __DIR__ . '/rules/redirects.php';
} else {
    require_once __DIR__ . '/rules/backend_legacy.php';
}
