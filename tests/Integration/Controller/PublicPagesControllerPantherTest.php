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
class PublicPagesControllerPantherTest extends PantherTestCase
{
    use RetryAnnotationTrait;
    use RetryTrait;

    /**
     * @dataProvider protectedPublicPagesRoutesProvider
     */
    public function testAnonymousUserIsRedirectedToLoginForPublicPagesRoutes(string $path): void
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

    public function testAuthenticatedUserCanOpenPublicPagesIndex(): void
    {
        $client = static::createPantherClient([
            'browser' => static::CHROME,
            'connection_timeout_in_ms' => 20000,
        ], [], [
            '--window-size=1400,1000',
        ]);
        $client->request('GET', '/login');
        $client->waitFor('form');

        $form = $client->getCrawler()->filter('button[type="submit"]')->form([
            'username' => 'admin',
            'password' => 'admin',
        ]);
        $client->submit($form);
        $client->waitFor('#vue-app');

        $client->request('GET', '/public/');
        $client->waitFor('#vue-app');

        $this->assertPageTitleContains('phpList - Public Pages');
        $this->assertSelectorExists('#vue-app');
    }

    /**
     * @return array<string, array{string}>
     */
    public function protectedPublicPagesRoutesProvider(): array
    {
        return [
            'public pages index route' => ['/public/'],
            'public pages create route' => ['/public/create'],
            'public pages edit route' => ['/public/11/edit'],
        ];
    }
}
