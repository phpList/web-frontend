<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Integration\Controller;

use PHPUnitRetry\RetryAnnotationTrait;
use PHPUnitRetry\RetryTrait;
use Symfony\Component\Panther\PantherTestCase;

/**
 * @retryAttempts 3
 * @retryIfException Facebook\WebDriver\Exception\NoSuchWindowException
 * @retryDelaySeconds 10
 */
class DashboardControllerPantherTest extends PantherTestCase
{
    use RetryAnnotationTrait;
    use RetryTrait;

    public function testAuthenticatedUserCanOpenDashboard(): void
    {
        $client = static::createPantherClient([
            'browser' => static::CHROME,
            'external_base_uri' => 'http://frontend.phplist.local/',
        ], [], [
            '--window-size=1400,1000',
            '--auto-open-devtools-for-tabs',
        ]);
        $client->request('GET', '/login');

        $client->submitForm('Sign In', [
            'username' => 'admin',
            'password' => 'admin',
        ]);

        $client->waitFor('#vue-app');

        $this->assertSelectorExists('body');
        $this->assertPageTitleContains('phpList - Dashboard');
    }
}
