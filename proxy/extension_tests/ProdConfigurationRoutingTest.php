<?php

namespace Oak\Proxy\Tests;

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

        // Rule order: 0 assets, 1 index, 2 backend (*.json), 3 redirects, 4 Tent's missing fallback
        // (which has no matchers, so it never reports a match).
        $this->assertCount(5, $rules);

        $assetsIndex = $this->matchingRuleIndex('GET', '/assets/index.js');
        $this->assertSame(0, $assetsIndex);
        $this->assertStaticHandler($rules[$assetsIndex]->handler());

        $rootIndex = $this->matchingRuleIndex('GET', '/');
        $this->assertSame(1, $rootIndex);
        $this->assertStaticHandler($rules[$rootIndex]->handler());
        $this->assertHasMiddleware($rules[$rootIndex]->handler(), SetPathMiddleware::class);

        $jsonIndex = $this->matchingRuleIndex('GET', '/categories.json');
        $this->assertSame(2, $jsonIndex);
        $this->assertProxyHandler($rules[$jsonIndex]->handler());
        $this->assertNotHasMiddleware($rules[$jsonIndex]->handler(), RedirectMiddleware::class);

        $redirectIndex = $this->matchingRuleIndex('GET', '/categories/1');
        $this->assertSame(3, $redirectIndex);
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

        $configDir = dirname(__DIR__, 2) . '/prod_configuration';

        require $configDir . '/rules/frontend.php';
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

    private function assertStaticHandler(RequestHandler $handler): void
    {
        $this->assertInstanceOf(StaticFileHandler::class, $handler);

        $folderLocation = $this->readProperty($handler, 'folderLocation');
        $this->assertSame(self::STATIC_ROOT . '/static', $folderLocation->basePath());
    }

    private function assertProxyHandler(RequestHandler $handler): void
    {
        $this->assertInstanceOf(DefaultProxyRequestHandler::class, $handler);

        $server = $this->readProperty($handler, 'server', ProxyRequestHandler::class);
        $this->assertSame(rtrim(self::BACKEND_HOST, '/'), rtrim($server->baseUrl(), '/'));
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
