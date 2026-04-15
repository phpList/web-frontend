<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Integration\Controller;

use PHPUnitRetry\RetryAnnotationTrait;
use PHPUnitRetry\RetryTrait;
use Symfony\Component\Panther\PantherTestCase;

/**
 * @retryAttempts 5
 * @retryIfException Facebook\WebDriver\Exception\NoSuchWindowException
 * @retryDelaySeconds 10
 */
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
        $client->request('GET', '/app_test.php/login');

        $this->assertPageTitleContains('phpList - Login');

        $this->assertSelectorExists('input[name="username"]');
        $this->assertSelectorExists('input[name="password"]');
        $this->assertSelectorTextContains('label[for="username"]', 'Login');
        $this->assertSelectorTextContains('label[for="password"]', 'Password');
        $this->assertSelectorExists('button[type="submit"]');
        $this->assertSelectorTextContains('button[type="submit"]', 'Sign In');

        $this->assertSelectorTextContains('h4', 'Sign in to your account');
    }

    public function testLoginFormSubmission(): void
    {
        $client = static::createPantherClient([
            'browser' => static::CHROME,
            'connection_timeout_in_ms' => 20000,
        ]);
        $client->request('GET', '/app_test.php/login');

        $client->submitForm('Sign In', [
            'username' => 'invalid_user',
            'password' => 'invalid_password'
        ]);

        $this->assertPageTitleContains('Login');
        $this->assertSelectorExists('.bg-red-50.border-red-200.text-red-600');
    }
}
