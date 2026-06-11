<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Integration\Controller;

use PHPUnitRetry\RetryAnnotationTrait;
use PHPUnitRetry\RetryTrait;
use Symfony\Component\Panther\PantherTestCase;

/**
 * @retryAttempts 1
 * @retryIfException Facebook\WebDriver\Exception\NoSuchWindowException
 * @retryDelaySeconds 5
 */
class PublicSubscribeControllerPantherTest extends PantherTestCase
{
    use RetryAnnotationTrait;
    use RetryTrait;

    private const PANTHER_OPTIONS = [
        'browser' => self::CHROME,
        'connection_timeout_in_ms' => 10000,
        'env' => [
            'APP_ENV' => 'test',
            'APP_DEBUG' => '1',
        ],
    ];

    /**
     * @dataProvider publicSubscribeAssetRoutesProvider
     */
    public function testAnonymousUserCanAccessPublicSubscribeAssetRoutes(string $path): void
    {
        $client = static::createPantherClient(self::PANTHER_OPTIONS);
        $client->getCookieJar()->clear();
        $client->request('GET', $path);

        $currentPath = (string) parse_url($client->getCurrentURL(), PHP_URL_PATH);

        $this->assertSame($path, $currentPath);
        $this->assertNotSame('/login', $currentPath);
    }

    /**
     * @return array<string, array{string}>
     */
    public function publicSubscribeAssetRoutesProvider(): array
    {
        return [
            'subscribe styles route' => ['/subscribe/styles/app.css'],
            'subscribe images route' => ['/subscribe/images/favicon.ico'],
            'unsubscribe images route' => ['/unsubscribe/images/favicon.ico'],
        ];
    }

    /**
     * @dataProvider publicSubscribePageRoutesProvider
     */
    public function testAnonymousUserCanAccessPublicSubscribeAndUnsubscribePages(string $path): void
    {
        $client = static::createPantherClient(self::PANTHER_OPTIONS);
        $client->getCookieJar()->clear();
        $client->request('GET', $path);

        $currentPath = (string) parse_url($client->getCurrentURL(), PHP_URL_PATH);

        $this->assertSame($path, $currentPath);
        $this->assertNotSame('/login', $currentPath);
    }

    public function testSubscribePageDisplaysEmailFieldAndSubmitButton(): void
    {
        $client = static::createPantherClient(self::PANTHER_OPTIONS);
        $client->getCookieJar()->clear();
        $client->request('GET', '/index.php/subscribe/1');

        $client->takeScreenshot('var/screenshots/public-subscribe-0.png');
        $client->waitFor('form.legacy-form', 10);
        $client->takeScreenshot('var/screenshots/public-subscribe-1.png');

        $currentPath = (string) parse_url($client->getCurrentURL(), PHP_URL_PATH);

        $this->assertSame('/index.php/subscribe/1', $currentPath);
        $this->assertNotSame('/login', $currentPath);
        $this->assertSelectorExists('form');
        $this->assertSelectorExists('input[name="email"][type="email"]');
        $this->assertSelectorExists('button[type="submit"]');
    }

    /**
     * @return array<string, array{string}>
     */
    public function publicSubscribePageRoutesProvider(): array
    {
        return [
            'subscribe page route' => ['/index.php/subscribe/1'],
            'unsubscribe page route' => ['/index.php/unsubscribe/1'],
        ];
    }
}
