<?php

namespace Oak\Proxy\Tests;

use Oak\Proxy\PhotoDeleteRequestHandler;
use Oak\Proxy\PhotoSubmitRequestHandler;
use Tent\RequestHandlers\DefaultProxyRequestHandler;
use Tent\RequestHandlers\ProxyRequestHandler;
use Tent\RequestHandlers\RequestHandler;
use Tent\RequestHandlers\StaticFileHandler;

/**
 * Assertions and reflection helpers for inspecting the handlers and
 * middlewares of configured Tent rules. Meant to be used by TestCase
 * subclasses only.
 */
trait RuleAssertions
{
    /**
     * Asserts the handler serves static files from the given base path.
     *
     * @param RequestHandler $handler  Handler under test.
     * @param string         $basePath Expected base path of the served folder.
     * @return void
     */
    private function assertStaticHandler(RequestHandler $handler, string $basePath): void
    {
        $this->assertInstanceOf(StaticFileHandler::class, $handler);

        $folderLocation = $this->readProperty($handler, 'folderLocation');
        $this->assertSame($basePath, $folderLocation->basePath());
    }

    /**
     * Asserts the handler proxies to the given host.
     *
     * @param RequestHandler $handler Handler under test.
     * @param string         $host    Expected backend host.
     * @return void
     */
    private function assertProxyHandler(RequestHandler $handler, string $host): void
    {
        $this->assertInstanceOf(DefaultProxyRequestHandler::class, $handler);

        $server = $this->readProperty($handler, 'server', ProxyRequestHandler::class);
        $this->assertSame(rtrim($host, '/'), rtrim($server->baseUrl(), '/'));
    }

    /**
     * Asserts the handler is a photo submit handler with the given settings.
     *
     * @param RequestHandler $handler            Handler under test.
     * @param string         $storageRoot        Expected storage root.
     * @param string         $host               Expected backend host.
     * @param integer        $maxUploadSizeBytes Expected upload size limit.
     * @return void
     */
    private function assertSubmitHandler(
        RequestHandler $handler,
        string $storageRoot,
        string $host,
        int $maxUploadSizeBytes
    ): void {
        $this->assertInstanceOf(PhotoSubmitRequestHandler::class, $handler);

        $this->assertSame($storageRoot, $this->readProperty($handler, 'storageRoot'));
        $this->assertSame(rtrim($host, '/'), $this->readProperty($handler, 'host'));
        $this->assertSame($maxUploadSizeBytes, $this->readProperty($handler, 'maxUploadSizeBytes'));
    }

    /**
     * Asserts the handler is a photo delete handler with the given settings.
     *
     * @param RequestHandler $handler     Handler under test.
     * @param string         $storageRoot Expected storage root.
     * @param string         $host        Expected backend host.
     * @return void
     */
    private function assertDeleteHandler(RequestHandler $handler, string $storageRoot, string $host): void
    {
        $this->assertInstanceOf(PhotoDeleteRequestHandler::class, $handler);

        $this->assertSame($storageRoot, $this->readProperty($handler, 'storageRoot'));

        $gateway = $this->readProperty($handler, 'gateway');
        $this->assertSame(rtrim($host, '/'), rtrim($this->readProperty($gateway, 'host'), '/'));
    }

    /**
     * Asserts the handler has a middleware of the given class.
     *
     * @param RequestHandler $handler Handler under test.
     * @param string         $class   Expected middleware class.
     * @return void
     */
    private function assertHasMiddleware(RequestHandler $handler, string $class): void
    {
        $this->assertTrue(
            $this->hasMiddleware($handler, $class),
            sprintf('Expected handler to have middleware %s', $class)
        );
    }

    /**
     * Asserts the handler has no middleware of the given class.
     *
     * @param RequestHandler $handler Handler under test.
     * @param string         $class   Unexpected middleware class.
     * @return void
     */
    private function assertNotHasMiddleware(RequestHandler $handler, string $class): void
    {
        $this->assertFalse(
            $this->hasMiddleware($handler, $class),
            sprintf('Expected handler not to have middleware %s', $class)
        );
    }

    /**
     * Tells whether the handler has a middleware of the given class.
     *
     * @param RequestHandler $handler Handler under test.
     * @param string         $class   Middleware class to look for.
     * @return boolean
     */
    private function hasMiddleware(RequestHandler $handler, string $class): bool
    {
        foreach ($this->readProperty($handler, 'middlewares') as $middleware) {
            if ($middleware instanceof $class) {
                return true;
            }
        }

        return false;
    }

    /**
     * Reads a (possibly private) property through reflection.
     *
     * @param object      $object         Object to read from.
     * @param string      $name           Property name.
     * @param string|null $declaringClass Class declaring the property, when it is not the object's own class.
     * @return mixed
     */
    private function readProperty(object $object, string $name, ?string $declaringClass = null): mixed
    {
        $property = new \ReflectionProperty($declaringClass ?? $object, $name);
        $property->setAccessible(true);

        return $property->getValue($object);
    }
}
