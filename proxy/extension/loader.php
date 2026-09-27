<?php

require_once __DIR__ . '/PhotoPathGuard.php';
require_once __DIR__ . '/PhotoRequestHandlerHelpers.php';
require_once __DIR__ . '/PhotoDeleteBackendGateway.php';
require_once __DIR__ . '/PhotoFileDeleter.php';
require_once __DIR__ . '/PhotoImageResizer.php';
require_once __DIR__ . '/PhotoSubmitBackendGateway.php';
require_once __DIR__ . '/PhotoVersionStorer.php';
require_once __DIR__ . '/PhotoMigrationBackendGateway.php';
require_once __DIR__ . '/PhotoFileMover.php';
require_once __DIR__ . '/PhotoSubmitRequestHandler.php';
require_once __DIR__ . '/PhotoDeleteRequestHandler.php';
require_once __DIR__ . '/PhotoMigrationBatchRunner.php';
require_once __DIR__ . '/PhotoMigrationRequestHandler.php';
require_once __DIR__ . '/CacheControlMiddleware.php';
