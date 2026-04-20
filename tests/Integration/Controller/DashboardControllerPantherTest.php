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
class DashboardControllerPantherTest extends PantherTestCase
{
    use RetryAnnotationTrait;
    use RetryTrait;

    public function testAuthenticatedUserCanOpenDashboard(): void
    {
        $client = static::createPantherClient([
            'browser' => static::CHROME,
            'connection_timeout_in_ms' => 20000,
        ], [], [
            '--window-size=1400,1000',
        ]);
        $client->request('GET', '/login');
        $client->takeScreenshot('var/screenshots/login-page.png');
        $client->waitFor('form');

        $form = $client->getCrawler()->filter('button[type="submit"]')->form([
            'username' => 'admin',
            'password' => 'admin',
        ]);
        $client->submit($form);

        $client->waitFor('#vue-app');

        $this->assertSelectorExists('body');
        $this->assertPageTitleContains('phpList - Dashboard');
    }
}
