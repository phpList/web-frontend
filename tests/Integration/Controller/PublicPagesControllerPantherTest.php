<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Integration\Controller;

use Facebook\WebDriver\WebDriverExpectedCondition;
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

    /**
     * @retryAttempts 1
     * @retryIfException Facebook\WebDriver\Exception\NoSuchWindowException
     * @retryIfException Facebook\WebDriver\Exception\TimeoutException
     * @retryDelaySeconds 5
     * @throws Throwable
     */
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
        $afterLogin = $this->describeCookies($client);

        $client->request('GET', '/public/');
        try {
            $client->waitFor('#vue-app');
        } catch (Throwable $e) {
            $client->takeScreenshot('var/screenshots/public-pages-index.png');
            fwrite(STDERR, sprintf(
                "Public pages index failed.\n  URL: %s\n  cookies after login: %s\n  cookies at failure: %s\n",
                $client->getCurrentURL(),
                $afterLogin,
                $this->describeCookies($client)
            ));
            throw $e;
        }

        // The server renders a placeholder title; the Vue router sets the final one after it mounts.
        $client->wait(10)->until(WebDriverExpectedCondition::titleContains('phpList - Public Pages'));
        $this->assertPageTitleContains('phpList - Public Pages');
        $this->assertSelectorExists('#vue-app');
    }

    private function describeCookies(Client $client): string
    {
        $cookies = [];
        foreach ($client->getCookieJar()->all() as $cookie) {
            $cookies[] = sprintf(
                '%s=%s (domain=%s path=%s expires=%s secure=%s)',
                $cookie->getName(),
                substr(hash('sha256', (string) $cookie->getValue()), 0, 8),
                (string) $cookie->getDomain(),
                (string) $cookie->getPath(),
                (string) $cookie->getExpiresTime(),
                $cookie->isSecure() ? 'yes' : 'no'
            );
        }

        return $cookies === [] ? '(none)' : implode('; ', $cookies);
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
