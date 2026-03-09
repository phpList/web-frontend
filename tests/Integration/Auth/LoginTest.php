<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Integration\Auth;

use PHPUnitRetry\RetryAnnotationTrait;
use PHPUnitRetry\RetryTrait;
use Symfony\Component\Panther\PantherTestCase;

/**
 * @retryAttempts 5
 * @retryIfException Facebook\WebDriver\Exception\NoSuchWindowException
 * @retryDelaySeconds 10
 */
class LoginTest extends PantherTestCase
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
        $this->assertSelectorExists('.login-container');
        $this->assertSelectorExists('#vue-app');

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
        $this->assertSelectorExists('.alert.alert-danger');
    }
}
