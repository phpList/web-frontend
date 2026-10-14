<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\Controller;

use PhpList\RestApiClient\Client;
use PhpList\RestApiClient\Entity\Administrator;
use PhpList\RestApiClient\Exception\ApiException;
use PhpList\WebFrontend\Controller\AuthController;
use PhpList\RestApiClient\Endpoint\AuthClient;
use PHPUnit\Framework\Assert;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use RuntimeException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Session\SessionInterface;

class AuthControllerTest extends TestCase
{
    private AuthClient&MockObject $authClient;
    private Client&MockObject $apiClient;
    private AuthController $controller;

    protected function setUp(): void
    {
        $this->authClient = $this->createMock(AuthClient::class);
        $this->apiClient = $this->createMock(Client::class);

        $this->controller = $this->getMockBuilder(AuthController::class)
            ->setConstructorArgs([$this->authClient, $this->apiClient, $this->createMock(LoggerInterface::class)])
            ->onlyMethods(['render', 'redirectToRoute', 'generateUrl'])
            ->getMock();

        $this->controller->method('render')
            ->willReturnCallback(function ($template, $params = []) {
                return new Response(
                    'Rendered template: ' . $template . ' with params: ' . json_encode($params)
                );
            });

        $this->controller->method('redirectToRoute')
            ->willReturnCallback(function ($route) {
                return new RedirectResponse('/mocked-route-to-' . $route);
            });

        $this->controller->method('generateUrl')
            ->willReturnCallback(function ($route) {
                return '/mocked-url-to-' . $route;
            });
    }

    public function testLoginWithGetRequest(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')
            ->willReturnMap([
                ['auth_token', false],
                ['login_error', false]
            ]);

        $request = $this->createMock(Request::class);
        $request->method('getSession')
            ->willReturn($session);
        $request->method('isMethod')
            ->with('POST')
            ->willReturn(false);

        $response = $this->controller->login($request);

        $this->assertStringContainsString('auth/login.html.twig', $response->getContent());
        $this->assertStringContainsString('with params', $response->getContent());
    }

    public function testLoginWithGetRequestAndError(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')
            ->willReturnMap([
                ['auth_token', false],
                ['login_error', true]
            ]);
        $session->method('get')
            ->with('login_error')
            ->willReturn('Test error message');
        $session->expects($this->once())
            ->method('remove')
            ->with('login_error');

        $request = $this->createMock(Request::class);
        $request->method('getSession')
            ->willReturn($session);
        $request->method('isMethod')
            ->with('POST')
            ->willReturn(false);

        $response = $this->controller->login($request);

        $this->assertStringContainsString('auth/login.html.twig', $response->getContent());
        $this->assertStringContainsString('Test error message', $response->getContent());
    }

    public function testLoginWithPostRequestSuccess(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')
            ->willReturnMap([
                ['auth_token', false],
                ['login_error', false]
            ]);

        $expected = [
            ['auth_token', 'test-token'],
            ['auth_expiry_date', '2026-03-18T14:15:38+04:00'],
            ['auth_id', 1],
        ];

        $index = 0;

        $session->expects($this->exactly(3))
            ->method('set')
            ->willReturnCallback(function ($key, $value) use (&$expected, &$index) {
                Assert::assertSame($expected[$index][0], $key);
                Assert::assertSame($expected[$index][1], $value);
                $index++;
            });

        $request = Request::create('/login', 'POST', [
            'username' => 'testuser',
            'password' => 'testpass',
        ]);
        $request->setSession($session);

        $this->authClient->method('login')
            ->with('testuser', 'testpass')
            ->willReturn(['key' => 'test-token', 'id' => 1, 'expiry_date' => '2026-03-18T14:15:38+04:00']);

        $response = $this->controller->login($request);

        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertStringContainsString('mocked-route-to-home', $response->getTargetUrl());
    }

    public function testLoginWithPostRequestSuccessRedirectsToOriginalPath(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')
            ->willReturnMap([
                ['auth_token', false],
                ['login_error', false]
            ]);

        $expected = [
            ['auth_token', 'test-token'],
            ['auth_expiry_date', '2026-03-18T14:15:38+04:00'],
            ['auth_id', 1],
        ];

        $index = 0;

        $session->expects($this->exactly(3))
            ->method('set')
            ->willReturnCallback(function ($key, $value) use (&$expected, &$index) {
                Assert::assertSame($expected[$index][0], $key);
                Assert::assertSame($expected[$index][1], $value);
                $index++;
            });

        $request = Request::create('/login', 'POST', [
            'username' => 'testuser',
            'password' => 'testpass',
            'redirect' => '/campaigns/42?tab=summary',
        ]);
        $request->setSession($session);

        $this->authClient->method('login')
            ->with('testuser', 'testpass')
            ->willReturn(['key' => 'test-token', 'id' => 1, 'expiry_date' => '2026-03-18T14:15:38+04:00']);

        $response = $this->controller->login($request);

        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertSame('/campaigns/42?tab=summary', $response->getTargetUrl());
    }

    public function testLoginWithPostRequestFailure(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')
            ->willReturnMap([
                ['auth_token', false],
                ['login_error', false]
            ]);

        $request = Request::create('/login', 'POST', [
            'username' => 'testuser',
            'password' => 'testpass',
        ]);
        $request->setSession($session);

        $this->authClient->method('login')
            ->with('testuser', 'testpass')
            ->willThrowException(new RuntimeException('Invalid credentials'));

        $response = $this->controller->login($request);

        $this->assertStringContainsString('auth/login.html.twig', $response->getContent());
        $this->assertStringContainsString(
            'Invalid credentials',
            $response->getContent(),
        );
    }

    public function testLoginWithExistingSession(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')
            ->willReturnMap([
                ['auth_token', true],
                ['login_error', false]
            ]);

        $request = $this->createMock(Request::class);
        $request->method('getSession')
            ->willReturn($session);

        $response = $this->controller->login($request);

        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertStringContainsString('/', $response->getTargetUrl());
    }

    public function testLoginWithExistingSessionAndRedirectTarget(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')
            ->willReturnMap([
                ['auth_token', true],
                ['login_error', false]
            ]);

        $request = Request::create('/login', 'GET', ['redirect' => '/lists/5/subscribers']);
        $request->setSession($session);

        $response = $this->controller->login($request);

        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertSame('/lists/5/subscribers', $response->getTargetUrl());
    }

    public function testLoginWithUnsafeRedirectFallsBackToHomeRoute(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')
            ->willReturnMap([
                ['auth_token', true],
                ['login_error', false]
            ]);

        $request = Request::create('/login', 'GET', ['redirect' => 'https://example.com/evil']);
        $request->setSession($session);

        $response = $this->controller->login($request);

        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertStringContainsString('mocked-route-to-home', $response->getTargetUrl());
    }

    public function testLogout(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $expected = [
            ['auth_token'],
            ['auth_id'],
        ];

        $index = 0;

        $session->expects($this->exactly(2))
            ->method('remove')
            ->willReturnCallback(function ($key) use (&$expected, &$index) {
                Assert::assertSame($expected[$index][0], $key);
                $index++;
            });

        $request = $this->createMock(Request::class);
        $request->method('getSession')
            ->willReturn($session);

        $response = $this->controller->logout($request);

        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertStringContainsString('login', $response->getTargetUrl());
    }

    public function testAbout(): void
    {
        $adminMock = $this->createMock(Administrator::class);
        $adminMock->method('toArray')
            ->willReturn([
                'id' => 123,
                'login_name' => 'testadmin',
                'email' => 'admin@example.com',
                'super_user' => true
            ]);

        $this->authClient->expects($this->once())
            ->method('getSessionUser')
            ->willReturn($adminMock);

        $this->apiClient->expects($this->once())
            ->method('setSessionId')
            ->with('session-token');

        $this->apiClient->expects($this->once())
            ->method('get')
            ->with('administrators/123')
            ->willReturn(['privileges' => ['statistics' => true]]);

        $session = $this->createMock(SessionInterface::class);
        $session->method('get')
            ->willReturnMap([
                ['auth_token', null, 'session-token'],
            ]);

        $request = $this->createMock(Request::class);
        $request->method('getSession')
            ->willReturn($session);

        $response = $this->controller->about($request);

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals(
            '{"id":123,"login_name":"testadmin","email":"admin@example.com",'
            . '"super_user":true,"privileges":{"statistics":true}}',
            $response->getContent()
        );
    }

    public function testAboutOmitsPrivilegesWhenAdministratorFetchFails(): void
    {
        $adminMock = $this->createMock(Administrator::class);
        $adminMock->method('toArray')
            ->willReturn([
                'id' => 123,
                'login_name' => 'testadmin',
                'email' => 'admin@example.com',
                'super_user' => true
            ]);

        $this->authClient->expects($this->once())
            ->method('getSessionUser')
            ->willReturn($adminMock);

        $this->apiClient->expects($this->once())
            ->method('get')
            ->with('administrators/123')
            ->willThrowException(new ApiException('not found', 404));

        $session = $this->createMock(SessionInterface::class);
        $session->method('get')
            ->willReturnMap([
                ['auth_token', null, 'session-token'],
            ]);

        $request = $this->createMock(Request::class);
        $request->method('getSession')
            ->willReturn($session);

        $response = $this->controller->about($request);

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals(
            '{"id":123,"login_name":"testadmin","email":"admin@example.com","super_user":true}',
            $response->getContent()
        );
    }

    public function testAboutReturnsBadGatewayWhenUpstreamFails(): void
    {
        $this->authClient->expects($this->once())
            ->method('getSessionUser')
            ->willThrowException(new ApiException('upstream down', 500));

        $session = $this->createMock(SessionInterface::class);
        $session->method('get')
            ->with('auth_token')
            ->willReturn('session-token');

        $request = $this->createMock(Request::class);
        $request->method('getSession')
            ->willReturn($session);

        $response = $this->controller->about($request);

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(Response::HTTP_BAD_GATEWAY, $response->getStatusCode());
    }

    public function testForgotPasswordRedirectsWhenAlreadyAuthenticated(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->with('auth_token')->willReturn(true);

        $request = Request::create('/forgot-password', 'GET');
        $request->setSession($session);

        $response = $this->controller->forgotPassword($request);

        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertStringContainsString('mocked-route-to-home', $response->getTargetUrl());
    }

    public function testForgotPasswordWithGetRequestShowsForm(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->with('auth_token')->willReturn(false);

        $request = Request::create('/forgot-password', 'GET');
        $request->setSession($session);

        $response = $this->controller->forgotPassword($request);

        $this->assertStringContainsString('auth/forgot_password.html.twig', $response->getContent());
        $this->assertStringContainsString('"error":null', $response->getContent());
        $this->assertStringContainsString('"success":null', $response->getContent());
    }

    public function testForgotPasswordWithInvalidEmailShowsError(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->with('auth_token')->willReturn(false);

        $this->apiClient->expects($this->never())->method('post');

        $request = Request::create('/forgot-password', 'POST', ['email' => 'not-an-email']);
        $request->setSession($session);

        $response = $this->controller->forgotPassword($request);

        $this->assertStringContainsString('Please enter a valid email address.', $response->getContent());
    }

    public function testForgotPasswordWithValidEmailShowsGenericSuccessMessage(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->with('auth_token')->willReturn(false);

        $this->apiClient->expects($this->once())
            ->method('post')
            ->with('password-reset/request', ['email' => 'admin@example.com']);

        $request = Request::create('/forgot-password', 'POST', ['email' => 'admin@example.com']);
        $request->setSession($session);

        $response = $this->controller->forgotPassword($request);

        $this->assertStringContainsString(
            'If an account exists for that email address',
            $response->getContent()
        );
    }

    public function testForgotPasswordShowsGenericSuccessMessageEvenWhenApiFails(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->with('auth_token')->willReturn(false);

        $this->apiClient->expects($this->once())
            ->method('post')
            ->with('password-reset/request', ['email' => 'unknown@example.com'])
            ->willThrowException(new ApiException('not found', 404));

        $request = Request::create('/forgot-password', 'POST', ['email' => 'unknown@example.com']);
        $request->setSession($session);

        $response = $this->controller->forgotPassword($request);

        $this->assertStringContainsString(
            'If an account exists for that email address',
            $response->getContent()
        );
    }

    public function testResetPasswordRedirectsWhenAlreadyAuthenticated(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->with('auth_token')->willReturn(true);

        $request = Request::create('/reset-password', 'GET');
        $request->setSession($session);

        $response = $this->controller->resetPassword($request);

        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertStringContainsString('mocked-route-to-home', $response->getTargetUrl());
    }

    public function testResetPasswordWithMissingTokenShowsError(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->with('auth_token')->willReturn(false);

        $request = Request::create('/reset-password', 'GET');
        $request->setSession($session);

        $response = $this->controller->resetPassword($request);

        $this->assertStringContainsString('invalid or has expired', $response->getContent());
        $this->assertStringContainsString('"token":null', $response->getContent());
    }

    public function testResetPasswordWithInvalidTokenShowsError(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->with('auth_token')->willReturn(false);

        $this->apiClient->expects($this->once())
            ->method('post')
            ->with('password-reset/validate', ['token' => 'bad-token'])
            ->willReturn(['valid' => false]);

        $request = Request::create('/reset-password', 'GET', ['token' => 'bad-token']);
        $request->setSession($session);

        $response = $this->controller->resetPassword($request);

        $this->assertStringContainsString('invalid or has expired', $response->getContent());
        $this->assertStringContainsString('"token":null', $response->getContent());
    }

    public function testResetPasswordWithValidTokenShowsForm(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->with('auth_token')->willReturn(false);

        $this->apiClient->expects($this->once())
            ->method('post')
            ->with('password-reset/validate', ['token' => 'good-token'])
            ->willReturn(['valid' => true]);

        $request = Request::create('/reset-password', 'GET', ['token' => 'good-token']);
        $request->setSession($session);

        $response = $this->controller->resetPassword($request);

        $this->assertStringContainsString('"error":null', $response->getContent());
        $this->assertStringContainsString('"token":"good-token"', $response->getContent());
    }

    public function testResetPasswordPostWithMismatchedPasswordsShowsError(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->with('auth_token')->willReturn(false);

        $this->apiClient->expects($this->never())->method('post');

        $request = Request::create('/reset-password', 'POST', [
            'token' => 'good-token',
            'newPassword' => 'password123',
            'confirmPassword' => 'password456',
        ]);
        $request->setSession($session);

        $response = $this->controller->resetPassword($request);

        $this->assertStringContainsString('Passwords do not match.', $response->getContent());
    }

    public function testResetPasswordPostWithShortPasswordShowsError(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->with('auth_token')->willReturn(false);

        $this->apiClient->expects($this->never())->method('post');

        $request = Request::create('/reset-password', 'POST', [
            'token' => 'good-token',
            'newPassword' => 'short',
            'confirmPassword' => 'short',
        ]);
        $request->setSession($session);

        $response = $this->controller->resetPassword($request);

        $this->assertStringContainsString('Password must be at least 8 characters long.', $response->getContent());
    }

    public function testResetPasswordPostSuccessRedirectsToLogin(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->with('auth_token')->willReturn(false);

        $this->apiClient->expects($this->once())
            ->method('post')
            ->with('password-reset/reset', ['token' => 'good-token', 'newPassword' => 'password123'])
            ->willReturn(['message' => 'Password updated successfully']);

        $request = Request::create('/reset-password', 'POST', [
            'token' => 'good-token',
            'newPassword' => 'password123',
            'confirmPassword' => 'password123',
        ]);
        $request->setSession($session);

        $response = $this->controller->resetPassword($request);

        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertStringContainsString('mocked-route-to-login', $response->getTargetUrl());
    }

    public function testResetPasswordPostWithApiExceptionShowsError(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->with('auth_token')->willReturn(false);

        $this->apiClient->expects($this->once())
            ->method('post')
            ->with('password-reset/reset', ['token' => 'expired-token', 'newPassword' => 'password123'])
            ->willThrowException(new ApiException('invalid token', 400));

        $request = Request::create('/reset-password', 'POST', [
            'token' => 'expired-token',
            'newPassword' => 'password123',
            'confirmPassword' => 'password123',
        ]);
        $request->setSession($session);

        $response = $this->controller->resetPassword($request);

        $this->assertStringContainsString('invalid or has expired', $response->getContent());
    }
}
