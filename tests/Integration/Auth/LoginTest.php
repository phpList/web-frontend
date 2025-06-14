<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Integration\Auth;

use Symfony\Component\Panther\PantherTestCase;
use Symfony\Component\Panther\Client;

class LoginTest extends PantherTestCase
{
    protected static ?Client $client = null;

    public function setUp(): void
    {
        parent::setUp();
        self::$client = static::createPantherClient([
            'browser' => static::CHROME,
        ]);
    }

    public function tearDown(): void
    {
        self::$client?->quit();
        parent::tearDown();
    }

    public function testLoginPageFormFieldsAreVisible(): void
    {
        self::$client->request('GET', '/app_test.php/login');

        $this->assertPageTitleContains('phpList - Login');

        $this->assertSelectorExists('input[name="username"]');
        $this->assertSelectorExists('input[name="password"]');
        $this->assertSelectorTextContains('label[for="username"]', 'Username');
        $this->assertSelectorTextContains('label[for="password"]', 'Password');
        $this->assertSelectorExists('button[type="submit"]');
        $this->assertSelectorTextContains('button[type="submit"]', 'Sign in');
        $this->assertSelectorExists('.login-container');
        $this->assertSelectorExists('#vue-app');

        $this->assertSelectorTextContains('h1', 'Sign in to phpList');
    }

    public function testLoginFormSubmission(): void
    {
        self::$client->request('GET', '/app_test.php/login');

        self::$client->submitForm('Sign in', [
            'username' => 'invalid_user',
            'password' => 'invalid_password'
        ]);

        $this->assertPageTitleContains('Login');
        $this->assertSelectorExists('.alert.alert-danger');
    }
}
