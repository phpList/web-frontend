<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Integration\Controller;

use PHPUnitRetry\RetryAnnotationTrait;
use PHPUnitRetry\RetryTrait;
use Symfony\Component\Panther\PantherTestCase;

class AuthControllerTest extends PantherTestCase
{
    use RetryAnnotationTrait;
    use RetryTrait;

    public function testLoginPageFormFieldsAreVisible(): void
    {
        $client = static::createPantherClient([
            'browser' => static::CHROME,
            'connection_timeout_in_ms' => 10000,
        ]);
        $client->getCookieJar()->clear();
        $client->request('GET', '/login');

        $client->takeScreenshot('var/screenshots/login-dashboard.png');

        $this->assertPageTitleContains('phpList - Login');

        $this->assertSelectorExists('input[name="username"]');
        $this->assertSelectorExists('input[name="password"]');
        $this->assertSelectorTextContains('label[for="username"]', 'Login');
        $this->assertSelectorTextContains('label[for="password"]', 'Password');
        $this->assertSelectorExists('button[type="submit"]');
        $this->assertSelectorTextContains('button[type="submit"]', 'Sign In');

        $this->assertSelectorTextContains('h4', 'Sign in to your account');
    }
}
