<?php

namespace Oak\Proxy\Tests;

use Oak\Proxy\CacheControlMiddleware;
use Oak\Proxy\PhotoDeleteRequestHandler;
use Oak\Proxy\PhotoSubmitRequestHandler;
use PHPUnit\Framework\TestCase;
use Tent\Configuration;
use Tent\Middlewares\RedirectMiddleware;
use Tent\Middlewares\SetPathMiddleware;
use Tent\Models\Request;
use Tent\RequestHandlers\DefaultProxyRequestHandler;
use Tent\RequestHandlers\ProxyRequestHandler;
use Tent\RequestHandlers\RequestHandler;
use Tent\RequestHandlers\StaticFileHandler;

/**
 * Routing spec for the committed production proxy configuration
 * (proxy/prod_configuration/).
 *
 * The real locals.php only exists on production servers, so this test never
 * loads configure.php. It sets the locals inline and requires the rule files
 * in the same order configure.php does.
 */
class ProdConfigurationRoutingTest extends TestCase
{
    private const BACKEND_HOST = 'https://oak-api.example.test/';
    private const STATIC_ROOT = '/tmp/oak-prod-config-test';
    private const STORAGE_ROOT = '/tmp/oak-prod-config-test-photos';
    private const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
    private const SUBMIT_PATH = '/uploads/categories/project/items/132/photos/549/submit';
    private const DELETE_PATH = '/uploads/categories/project/items/132/photos/549';
    private const PHOTO_PATH = '/photos/users/1/items/2/a.jpg';
    private const SNAP_PATH = '/snaps/users/1/items/2/a.jpg';

    protected function setUp(): void
    {
        parent::setUp();

        Configuration::reset();
    }

    protected function tearDown(): void
    {
        Configuration::reset();

        parent::tearDown();
    }

    /**
     * All assertions live in a single method so the rule files are loaded
     * only once per test run and no rule is ever registered twice.
     */
    public function testProdRulesRouteRequestsInOrder(): void
    {
        $this->loadProdRules();

        $rules = Configuration::getRules();

        // Rule order: 0 assets, 1 index, 2 photos, 3 snaps, 4 uploads, 5 deletes,
        // 6 backend (*.json), 7 redirects, 8 Tent's missing fallback (which has
        // no matchers, so it never reports a match).
        $this->assertCount(9, $rules);

        $assetsIndex = $this->matchingRuleIndex('GET', '/assets/index.js');
        $this->assertSame(0, $assetsIndex);
        $this->assertStaticHandler($rules[$assetsIndex]->handler());

        $rootIndex = $this->matchingRuleIndex('GET', '/');
        $this->assertSame(1, $rootIndex);
        $this->assertStaticHandler($rules[$rootIndex]->handler());
        $this->assertHasMiddleware($rules[$rootIndex]->handler(), SetPathMiddleware::class);

        $photoIndex = $this->matchingRuleIndex('GET', self::PHOTO_PATH);
        $this->assertSame(2, $photoIndex);
        $this->assertStaticHandler($rules[$photoIndex]->handler(), self::STATIC_ROOT);
        $this->assertHasMiddleware($rules[$photoIndex]->handler(), CacheControlMiddleware::class);

        $snapIndex = $this->matchingRuleIndex('GET', self::SNAP_PATH);
        $this->assertSame(3, $snapIndex);
        $this->assertStaticHandler($rules[$snapIndex]->handler(), self::STATIC_ROOT);
        $this->assertHasMiddleware($rules[$snapIndex]->handler(), CacheControlMiddleware::class);

        // Only GETs are served statically: other methods on photo paths never hit the photo rules.
        $this->assertNotContains($this->matchingRuleIndex('POST', self::PHOTO_PATH), [2, 3]);
        $this->assertNotContains($this->matchingRuleIndex('DELETE', self::PHOTO_PATH), [2, 3]);
        $this->assertNotContains($this->matchingRuleIndex('POST', self::SNAP_PATH), [2, 3]);
        $this->assertNotContains($this->matchingRuleIndex('DELETE', self::SNAP_PATH), [2, 3]);

        $submitIndex = $this->matchingRuleIndex('POST', self::SUBMIT_PATH);
        $this->assertSame(4, $submitIndex);
        $this->assertSubmitHandler($rules[$submitIndex]->handler());
        $this->assertSame(4, $this->matchingRuleIndex('POST', self::SUBMIT_PATH . '/'));

        $deleteIndex = $this->matchingRuleIndex('DELETE', self::DELETE_PATH);
        $this->assertSame(5, $deleteIndex);
        $this->assertDeleteHandler($rules[$deleteIndex]->handler());

        // A GET on the submit path is not an upload: it falls through to redirects.
        $this->assertSame(7, $this->matchingRuleIndex('GET', self::SUBMIT_PATH));

        $jsonIndex = $this->matchingRuleIndex('GET', '/categories.json');
        $this->assertSame(6, $jsonIndex);
        $this->assertProxyHandler($rules[$jsonIndex]->handler());
        $this->assertNotHasMiddleware($rules[$jsonIndex]->handler(), RedirectMiddleware::class);

        $redirectIndex = $this->matchingRuleIndex('GET', '/categories/1');
        $this->assertSame(7, $redirectIndex);
        $this->assertProxyHandler($rules[$redirectIndex]->handler());
        $this->assertHasMiddleware($rules[$redirectIndex]->handler(), RedirectMiddleware::class);

        // Hash routes are not redirected again: no configured rule matches them.
        $this->assertNull($this->matchingRuleIndex('GET', '/#/categories/1'));
    }

    private function loadProdRules(): void
    {
        // Stand-ins for the server-only locals.php, consumed by the rule files.
        $backendHost = self::BACKEND_HOST;
        $staticRoot = self::STATIC_ROOT;
        $storageRoot = self::STORAGE_ROOT;
        $maxUploadSizeBytes = self::MAX_UPLOAD_SIZE_BYTES;

        $configDir = dirname(__DIR__, 2) . '/prod_configuration';

        require $configDir . '/rules/frontend.php';
        require $configDir . '/rules/photos.php';
        require $configDir . '/rules/uploads.php';
        require $configDir . '/rules/deletes.php';
        require $configDir . '/rules/backend.php';
        require $configDir . '/rules/redirects.php';
    }

    private function matchingRuleIndex(string $method, string $path): ?int
    {
        $request = new Request(['requestMethod' => $method, 'requestPath' => $path]);

        foreach (Configuration::getRules() as $index => $rule) {
            if ($rule->match($request)) {
                return $index;
            }
        }

        return null;
    }

    private function assertStaticHandler(
        RequestHandler $handler,
        string $basePath = self::STATIC_ROOT . '/static'
    ): void {
        $this->assertInstanceOf(StaticFileHandler::class, $handler);

        $folderLocation = $this->readProperty($handler, 'folderLocation');
        $this->assertSame($basePath, $folderLocation->basePath());
    }

    private function assertProxyHandler(RequestHandler $handler): void
    {
        $this->assertInstanceOf(DefaultProxyRequestHandler::class, $handler);

        $server = $this->readProperty($handler, 'server', ProxyRequestHandler::class);
        $this->assertSame(rtrim(self::BACKEND_HOST, '/'), rtrim($server->baseUrl(), '/'));
    }

    private function assertSubmitHandler(RequestHandler $handler): void
    {
        $this->assertInstanceOf(PhotoSubmitRequestHandler::class, $handler);

        $this->assertSame(self::STORAGE_ROOT, $this->readProperty($handler, 'storageRoot'));
        $this->assertSame(rtrim(self::BACKEND_HOST, '/'), $this->readProperty($handler, 'host'));
        $this->assertSame(self::MAX_UPLOAD_SIZE_BYTES, $this->readProperty($handler, 'maxUploadSizeBytes'));
    }

    private function assertDeleteHandler(RequestHandler $handler): void
    {
        $this->assertInstanceOf(PhotoDeleteRequestHandler::class, $handler);

        $this->assertSame(self::STORAGE_ROOT, $this->readProperty($handler, 'storageRoot'));

        $gateway = $this->readProperty($handler, 'gateway');
        $this->assertSame(rtrim(self::BACKEND_HOST, '/'), rtrim($this->readProperty($gateway, 'host'), '/'));
    }

    private function assertHasMiddleware(RequestHandler $handler, string $class): void
    {
        $this->assertTrue(
            $this->hasMiddleware($handler, $class),
            sprintf('Expected handler to have middleware %s', $class)
        );
    }

    private function assertNotHasMiddleware(RequestHandler $handler, string $class): void
    {
        $this->assertFalse(
            $this->hasMiddleware($handler, $class),
            sprintf('Expected handler not to have middleware %s', $class)
        );
    }

    private function hasMiddleware(RequestHandler $handler, string $class): bool
    {
        foreach ($this->readProperty($handler, 'middlewares') as $middleware) {
            if ($middleware instanceof $class) {
                return true;
            }
        }

        return false;
    }

    private function readProperty(object $object, string $name, ?string $declaringClass = null): mixed
    {
        $property = new \ReflectionProperty($declaringClass ?? $object, $name);
        $property->setAccessible(true);

        return $property->getValue($object);
    }
}
