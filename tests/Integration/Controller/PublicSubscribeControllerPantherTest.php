<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Integration\Controller;

use PHPUnitRetry\RetryAnnotationTrait;
use PHPUnitRetry\RetryTrait;
use Symfony\Component\Panther\Client;
use Symfony\Component\Panther\PantherTestCase;
use Throwable;

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
        try {
            $client->getCookieJar()->clear();
            $client->request('GET', '/index.php/subscribe/1');

            $client->takeScreenshot('var/screenshots/public-subscribe-0.png');
            $client->waitFor('form.legacy-form', 10);
        } catch (Throwable $throwable) {
            $client->takeScreenshot('var/screenshots/public-subscribe-error.png');
            $this->writePublicSubscribeDiagnostics($client, $throwable);

            throw $throwable;
        }
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

    private function writePublicSubscribeDiagnostics(Client $client, Throwable $throwable): void
    {
        $diagnosticsDir = __DIR__ . '/../../../var/screenshots';
        if (!is_dir($diagnosticsDir)) {
            mkdir($diagnosticsDir, 0777, true);
        }

        $pageSource = $this->readPageSource($client);
        file_put_contents($diagnosticsDir . '/public-subscribe-error.html', $pageSource);
        file_put_contents(
            $diagnosticsDir . '/public-subscribe-error.txt',
            implode("\n\n", [
                'Exception: ' . $throwable::class,
                'Message: ' . $throwable->getMessage(),
                'Current URL: ' . $this->readCurrentUrl($client),
                'Page title: ' . $this->readPageTitle($client),
                'Body text: ' . $this->readBodyText($client),
                'Recent Symfony logs:' . "\n" . $this->readRecentSymfonyLogs(),
            ])
        );

        fwrite(STDERR, "Public subscribe diagnostics written to var/screenshots/public-subscribe-error.*\n");
    }

    private function readPageSource(Client $client): string
    {
        try {
            return $client->getPageSource();
        } catch (Throwable $throwable) {
            return 'Unable to read page source: ' . $throwable->getMessage();
        }
    }

    private function readCurrentUrl(Client $client): string
    {
        try {
            return $client->getCurrentURL();
        } catch (Throwable $throwable) {
            return 'Unable to read current URL: ' . $throwable->getMessage();
        }
    }

    private function readPageTitle(Client $client): string
    {
        try {
            return $client->getTitle();
        } catch (Throwable $throwable) {
            return 'Unable to read page title: ' . $throwable->getMessage();
        }
    }

    private function readBodyText(Client $client): string
    {
        try {
            return $client->getCrawler()->filter('body')->text('', true);
        } catch (Throwable $throwable) {
            return 'Unable to read body text: ' . $throwable->getMessage();
        }
    }

    private function readRecentSymfonyLogs(): string
    {
        $projectDir = dirname(__DIR__, 3);
        $paths = array_merge(
            glob($projectDir . '/var/logs/*.log') ?: [],
            glob($projectDir . '/var/log/*.log') ?: []
        );

        if ($paths === []) {
            return sprintf('No log files found under %s/var/logs or %s/var/log.', $projectDir, $projectDir);
        }

        $logs = [];
        foreach (array_unique($paths) as $path) {
            $logs[] = sprintf("==> %s <==\n%s", $path, $this->readRecentLogLines($path));
        }

        return implode("\n\n", $logs);
    }

    private function readRecentLogLines(string $path): string
    {
        if (!is_file($path)) {
            return sprintf('Log file %s does not exist.', $path);
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES);
        if ($lines === false) {
            return sprintf('Unable to read log file %s.', $path);
        }

        return implode("\n", array_slice($lines, -80));
    }
}
