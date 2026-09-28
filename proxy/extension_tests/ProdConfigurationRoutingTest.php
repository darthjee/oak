<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/RuleAssertions.php';

use Oak\Proxy\CacheControlMiddleware;
use PHPUnit\Framework\TestCase;
use Tent\Configuration;
use Tent\Middlewares\RedirectMiddleware;
use Tent\Middlewares\SetPathMiddleware;
use Tent\Models\Request;

/**
 * Routing spec for the committed production proxy configuration
 * (proxy/prod_configuration/).
 *
 * The real locals.php only exists on production servers, so this test never
 * loads configure.php. It builds the locals as an explicit array and includes
 * each rule file through includeRuleFile(), in the same order configure.php does.
 *
 * Tent\Configuration only exposes a static API (reset(), getRules()), so there
 * is no instance to inject.
 *
 * @SuppressWarnings("PHPMD.StaticAccess")
 */
class ProdConfigurationRoutingTest extends TestCase
{
    use RuleAssertions;

    private const BACKEND_HOST = 'https://oak-api.example.test/';
    private const STATIC_ROOT = '/tmp/oak-prod-config-test';
    private const STORAGE_ROOT = '/tmp/oak-prod-config-test-photos';
    private const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
    private const SUBMIT_PATH = '/uploads/categories/project/items/132/photos/549/submit';
    private const DELETE_PATH = '/uploads/categories/project/items/132/photos/549';
    private const PHOTO_PATH = '/photos/users/1/items/2/a.jpg';
    private const SNAP_PATH = '/snaps/users/1/items/2/a.jpg';
    private const RULE_FILES = ['frontend', 'photos', 'uploads', 'deletes', 'backend', 'redirects'];

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
        $this->assertStaticHandler($rules[$assetsIndex]->handler(), self::STATIC_ROOT . '/static');

        $rootIndex = $this->matchingRuleIndex('GET', '/');
        $this->assertSame(1, $rootIndex);
        $this->assertStaticHandler($rules[$rootIndex]->handler(), self::STATIC_ROOT . '/static');
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
        $this->assertSubmitHandler(
            $rules[$submitIndex]->handler(),
            self::STORAGE_ROOT,
            self::BACKEND_HOST,
            self::MAX_UPLOAD_SIZE_BYTES
        );
        $this->assertSame(4, $this->matchingRuleIndex('POST', self::SUBMIT_PATH . '/'));

        $deleteIndex = $this->matchingRuleIndex('DELETE', self::DELETE_PATH);
        $this->assertSame(5, $deleteIndex);
        $this->assertDeleteHandler($rules[$deleteIndex]->handler(), self::STORAGE_ROOT, self::BACKEND_HOST);

        // A GET on the submit path is not an upload: it falls through to redirects.
        $this->assertSame(7, $this->matchingRuleIndex('GET', self::SUBMIT_PATH));

        $jsonIndex = $this->matchingRuleIndex('GET', '/categories.json');
        $this->assertSame(6, $jsonIndex);
        $this->assertProxyHandler($rules[$jsonIndex]->handler(), self::BACKEND_HOST);
        $this->assertNotHasMiddleware($rules[$jsonIndex]->handler(), RedirectMiddleware::class);

        $redirectIndex = $this->matchingRuleIndex('GET', '/categories/1');
        $this->assertSame(7, $redirectIndex);
        $this->assertProxyHandler($rules[$redirectIndex]->handler(), self::BACKEND_HOST);
        $this->assertHasMiddleware($rules[$redirectIndex]->handler(), RedirectMiddleware::class);

        // Hash routes are not redirected again: no configured rule matches them.
        $this->assertNull($this->matchingRuleIndex('GET', '/#/categories/1'));
    }

    private function loadProdRules(): void
    {
        // Stand-ins for the server-only locals.php, consumed by the rule files.
        $locals = [
            'backendHost'        => self::BACKEND_HOST,
            'staticRoot'         => self::STATIC_ROOT,
            'storageRoot'        => self::STORAGE_ROOT,
            'maxUploadSizeBytes' => self::MAX_UPLOAD_SIZE_BYTES,
        ];

        $configDir = dirname(__DIR__, 2) . '/prod_configuration';

        foreach (self::RULE_FILES as $file) {
            $this->includeRuleFile($configDir . '/rules/' . $file . '.php', $locals);
        }
    }

    /**
     * Includes a rule file with the given locals in scope, the same way
     * configure.php exposes the variables defined by locals.php.
     */
    private function includeRuleFile(string $path, array $locals): void
    {
        $this->assertFileExists($path);

        extract($locals);

        include $path;
    }

    private function matchingRuleIndex(string $method, string $path): ?int
    {
        $request = new Request(['requestMethod' => $method, 'requestPath' => $path]);

        foreach (Configuration::getRules() as $index => $rule) {
            if ($rule->match($request) === true) {
                return $index;
            }
        }

        return null;
    }
}
