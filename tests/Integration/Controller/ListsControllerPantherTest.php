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
class ListsControllerPantherTest extends PantherTestCase
{
    use RetryAnnotationTrait;
    use RetryTrait;

    /**
     * @dataProvider protectedListRoutesProvider
     */
    public function testAnonymousUserIsRedirectedToLoginForListsRoutes(string $path): void
    {
        $client = static::createPantherClient([
            'browser' => static::CHROME,
            'connection_timeout_in_ms' => 10000,
        ]);
        $client->request('GET', $path);

        $this->assertPageTitleContains('phpList - Login');
        $this->assertSelectorExists('form');
        $this->assertSelectorExists('input[name="username"]');
        $this->assertSelectorExists('input[name="password"]');
    }

    /**
     * @return array<string, array{string}>
     */
    public function protectedListRoutesProvider(): array
    {
        return [
            'lists index route' => ['/app_test.php/lists/'],
            'list subscribers route' => ['/app_test.php/lists/11/subscribers'],
        ];
    }
}
