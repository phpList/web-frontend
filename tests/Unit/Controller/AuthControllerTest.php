<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\Controller;

use PhpList\RestApiClient\Client;
use PhpList\RestApiClient\Entity\Administrator;
use PhpList\RestApiClient\Exception\ApiException;
use PhpList\WebFrontend\Controller\AuthController;
use PhpList\RestApiClient\Endpoint\AuthClient;
use PhpList\RestApiClient\Endpoint\PasswordResetClient;
use PhpList\WebFrontend\Service\AuthenticationService;
use PhpList\WebFrontend\Service\LoginThrottle;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Psr7\Request as GuzzleRequest;
use PHPUnit\Framework\Assert;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use RuntimeException;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\Cache\Adapter\ArrayAdapter;
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
    private LoggerInterface&MockObject $logger;
    private bool $csrfTokenValid = true;

    protected function setUp(): void
    {
        $this->authClient = $this->createMock(AuthClient::class);
        $this->apiClient = $this->createMock(Client::class);

        $this->controller = $this->getMockBuilder(AuthController::class)
            ->setConstructorArgs([
                $this->authClient,
                new PasswordResetClient($this->apiClient),
                $this->apiClient,
                new AuthenticationService($this->apiClient),
                $this->logger = $this->createMock(LoggerInterface::class),
                new LoginThrottle(new ArrayAdapter(), 3, 5, 900),
            ])
            ->onlyMethods(['render', 'redirectToRoute', 'generateUrl', 'isCsrfTokenValid'])
            ->getMock();

        $this->controller->method('render')
            ->willReturnCallback(function ($template, $params = []) {
                return new Response(
                    'Rendered template: ' . $template . ' with params: ' . json_encode($params)
                );
            });

        $this->controller->method('isCsrfTokenValid')
            ->willReturnCallback(fn (string $id, ?string $token) => $this->csrfTokenValid && $token === 'good-token');

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

        $request = Request::create('/login', 'GET');
        $request->setSession($session);

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

        $request = Request::create('/login', 'GET');
        $request->setSession($session);

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
            ['admin_id', 7],
        ];

        $index = 0;

        $session->expects($this->exactly(4))
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
        $this->authClient->method('getSessionUser')
            ->willReturn(new Administrator(['id' => 7, 'login_name' => 'testuser', 'created_at' => '2026-01-01']));

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
            ['admin_id', 7],
        ];

        $index = 0;

        $session->expects($this->exactly(4))
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
        $this->authClient->method('getSessionUser')
            ->willReturn(new Administrator(['id' => 7, 'login_name' => 'testuser', 'created_at' => '2026-01-01']));

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
            ->willThrowException(new RuntimeException('Invalid credentials', 401));

        $response = $this->controller->login($request);

        $this->assertStringContainsString('auth/login.html.twig', $response->getContent());
        $this->assertStringContainsString(
            'Invalid credentials.',
            $response->getContent(),
        );
    }

    public function testLoginFailureDoesNotLeakUpstreamDetails(): void
    {
        $this->authClient->method('login')->willThrowException(
            new RuntimeException('cURL error 7: Failed to connect to http://10.0.0.5:8080/api/v2/sessions')
        );
        $this->logger->expects($this->once())
            ->method('error')
            ->with($this->stringContains('10.0.0.5'));

        $response = $this->controller->login($this->postLoginRequest('testuser', 'wrong'));

        $this->assertStringNotContainsString('10.0.0.5', $response->getContent());
        $this->assertStringNotContainsString('cURL', $response->getContent());
        $this->assertStringContainsString('Unable to sign in right now', $response->getContent());
    }

    public function testLoginFailureWithGuzzleExceptionDoesNotLeakUpstreamDetails(): void
    {
        $this->authClient->method('login')->willThrowException(
            new ConnectException(
                'Connection refused for http://internal-api.local/api/v2',
                new GuzzleRequest('POST', 'http://internal-api.local')
            )
        );

        $response = $this->controller->login($this->postLoginRequest('testuser', 'wrong'));

        $this->assertStringNotContainsString('internal-api.local', $response->getContent());
        $this->assertStringContainsString('Invalid credentials.', $response->getContent());
    }

    public function testLoginIsBlockedAfterTooManyFailedAttempts(): void
    {
        $this->authClient->expects($this->exactly(3))
            ->method('login')
            ->willThrowException(new RuntimeException('nope', 401));

        for ($i = 0; $i < 3; $i++) {
            $this->assertSame(
                200,
                $this->controller->login(
                    $this->postLoginRequest(
                        'victim',
                        'guess' . $i
                    )
                )->getStatusCode()
            );
        }

        // The 4th attempt never reaches the API, even with the right password.
        $response = $this->controller->login($this->postLoginRequest('victim', 'correct-password'));

        $this->assertSame(Response::HTTP_TOO_MANY_REQUESTS, $response->getStatusCode());
        $this->assertSame('900', $response->headers->get('Retry-After'));
        $this->assertStringContainsString('Too many attempts', $response->getContent());
    }

    public function testLoginThrottleAppliesPerUsernameCaseInsensitively(): void
    {
        $this->authClient->method('login')->willThrowException(new RuntimeException('nope', 401));

        foreach (['victim', 'VICTIM', 'Victim'] as $name) {
            $this->controller->login($this->postLoginRequest($name, 'x', '10.0.0.' . random_int(1, 200)));
        }

        // Attempts from yet another IP are still blocked for the targeted account.
        $response = $this->controller->login($this->postLoginRequest('victim', 'x', '192.168.1.1'));

        $this->assertSame(Response::HTTP_TOO_MANY_REQUESTS, $response->getStatusCode());
    }

    public function testLoginIsBlockedPerIpAcrossUsernames(): void
    {
        $this->authClient->method('login')->willThrowException(new RuntimeException('nope', 401));

        for ($i = 0; $i < 5; $i++) {
            $this->controller->login($this->postLoginRequest('user' . $i, 'x'));
        }

        $response = $this->controller->login($this->postLoginRequest('another-user', 'x'));

        $this->assertSame(Response::HTTP_TOO_MANY_REQUESTS, $response->getStatusCode());
    }

    public function testSuccessfulLoginResetsTheUsernameCounter(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->willReturn(false);
        $this->authClient->method('login')->willReturnOnConsecutiveCalls(
            $this->throwException(new RuntimeException('nope', 401)),
            $this->throwException(new RuntimeException('nope', 401)),
            ['key' => 'tok', 'id' => 1, 'expiry_date' => '2099-01-01T00:00:00+00:00'],
            $this->throwException(new RuntimeException('nope', 401)),
        );
        $this->authClient->method('getSessionUser')
            ->willReturn(new Administrator(['id' => 7, 'login_name' => 'u', 'created_at' => '2026-01-01']));

        $this->controller->login($this->postLoginRequest('admin', 'x', '10.0.0.1', $session));
        $this->controller->login($this->postLoginRequest('admin', 'x', '10.0.0.1', $session));
        $this->assertInstanceOf(
            RedirectResponse::class,
            $this->controller->login($this->postLoginRequest('admin', 'ok', '10.0.0.1', $session))
        );

        // Counter was reset, so a later typo is a normal failure rather than a lock-out.
        $this->assertSame(
            200,
            $this->controller->login(
                $this->postLoginRequest(
                    'admin',
                    'x',
                    '10.0.0.1',
                    $session
                )
            )->getStatusCode()
        );
    }

    /**
     * @dataProvider unsafeRedirectProvider
     */
    public function testLoginIgnoresUnsafeRedirectTargets(string $target): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->willReturnMap([['auth_token', true], ['login_error', false]]);

        $request = Request::create('/login', 'GET', ['redirect' => $target]);
        $request->setSession($session);

        $response = $this->controller->login($request);

        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertStringContainsString('mocked-route-to-home', $response->getTargetUrl());
    }

    /**
     * @return array<string, array{string}>
     */
    public static function unsafeRedirectProvider(): array
    {
        return [
            'backslash host' => ['/\\evil.com'],
            'backslash after slash path' => ['/\\/evil.com'],
            'tab hidden slash' => ["/\t/evil.com"],
            'newline hidden slash' => ["/\n/evil.com"],
            'scheme-relative' => ['//evil.com'],
            'absolute url' => ['https://evil.com'],
            'javascript scheme' => ['javascript:alert(1)'],
        ];
    }

    private function postLoginRequest(
        string $username,
        string $password,
        string $ip = '10.0.0.1',
        ?SessionInterface $session = null,
    ): Request {
        if ($session === null) {
            $session = $this->createMock(SessionInterface::class);
            $session->method('has')->willReturnMap([['auth_token', false], ['login_error', false]]);
        }
        $request = Request::create('/login', 'POST', ['username' => $username, 'password' => $password], [], [], [
            'REMOTE_ADDR' => $ip,
        ]);
        $request->setSession($session);

        return $request;
    }

    public function testLoginWithExistingSession(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')
            ->willReturnMap([
                ['auth_token', true],
                ['login_error', false]
            ]);

        $request = Request::create('/login', 'GET');
        $request->setSession($session);

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
        $removed = [];
        $session->method('remove')->willReturnCallback(function ($key) use (&$removed) {
            $removed[] = $key;
        });
        // The whole server-side session must be dropped, not just the auth keys.
        $session->expects($this->once())->method('invalidate');

        $request = Request::create('/logout', 'POST', ['_token' => 'good-token']);
        $request->setSession($session);

        $response = $this->controller->logout($request);

        $this->assertSame(['auth_token', 'auth_expiry_date', 'auth_id', 'admin_id'], $removed);
        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertStringContainsString('login', $response->getTargetUrl());
    }

    public function testLogoutRejectsInvalidCsrfToken(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->expects($this->never())->method('remove');
        $session->expects($this->never())->method('invalidate');
        $this->authClient->expects($this->never())->method('logout');

        $request = Request::create('/logout', 'POST', ['_token' => 'forged']);
        $request->setSession($session);

        $this->expectException(AccessDeniedException::class);

        $this->controller->logout($request);
    }

    public function testLogoutRejectsMissingCsrfToken(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->expects($this->never())->method('invalidate');

        $request = Request::create('/logout', 'POST');
        $request->setSession($session);

        $this->expectException(AccessDeniedException::class);

        $this->controller->logout($request);
    }

    public function testLogoutRouteOnlyAcceptsPost(): void
    {
        $attributes = (new \ReflectionMethod(AuthController::class, 'logout'))
            ->getAttributes(\Symfony\Component\Routing\Attribute\Route::class);

        $this->assertCount(1, $attributes);
        $this->assertSame(['POST'], $attributes[0]->newInstance()->getMethods());
    }

    public function testForgotPasswordIsThrottled(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->willReturn(false);

        $send = function (string $email) use ($session): Response {
            $request = Request::create(
                '/forgot-password',
                'POST',
                ['email' => $email],
                [],
                [],
                ['REMOTE_ADDR' => '10.0.0.9']
            );
            $request->setSession($session);

            return $this->controller->forgotPassword($request);
        };

        for ($i = 0; $i < 3; $i++) {
            $this->assertSame(200, $send('admin@example.com')->getStatusCode());
        }

        $response = $send('admin@example.com');
        $this->assertSame(Response::HTTP_TOO_MANY_REQUESTS, $response->getStatusCode());
        $this->assertStringContainsString('Too many attempts', $response->getContent());
    }

    public function testResetPasswordPostIsThrottled(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->willReturn(false);
        $this->apiClient->method('post')->willThrowException(new ApiException('bad token', 400));

        $send = function () use ($session): Response {
            $request = Request::create(
                '/reset-password',
                'POST',
                ['token' => 'guess', 'newPassword' => 'password123', 'confirmPassword' => 'password123'],
                [],
                [],
                ['REMOTE_ADDR' => '10.0.0.9']
            );
            $request->setSession($session);

            return $this->controller->resetPassword($request);
        };

        for ($i = 0; $i < 5; $i++) {
            $this->assertSame(200, $send()->getStatusCode());
        }

        $this->assertSame(Response::HTTP_TOO_MANY_REQUESTS, $send()->getStatusCode());
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

        $request = Request::create('/reset-password', 'GET', ['uniqueId' => 'bad-token']);
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

        $request = Request::create('/reset-password', 'GET', ['uniqueId' => 'good-token']);
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

    public function testLoginStillSucceedsWhenTheAdministratorIdCannotBeLoaded(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->willReturnMap([['auth_token', false], ['login_error', false]]);

        $stored = [];
        $session->method('set')->willReturnCallback(function ($key) use (&$stored) {
            $stored[] = $key;
        });

        $request = Request::create('/login', 'POST', ['username' => 'testuser', 'password' => 'testpass']);
        $request->setSession($session);

        $this->authClient->method('login')
            ->willReturn(['key' => 'test-token', 'id' => 1, 'expiry_date' => '2026-03-18T14:15:38+04:00']);
        $this->authClient->method('getSessionUser')->willThrowException(new ApiException('down'));

        $response = $this->controller->login($request);

        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertNotContains('admin_id', $stored);
    }

    public function testLoginStillSucceedsWhenTheAdministratorResponseCannotBeParsed(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->willReturnMap([['auth_token', false], ['login_error', false]]);

        $stored = [];
        $session->method('set')->willReturnCallback(function ($key) use (&$stored) {
            $stored[] = $key;
        });

        $request = Request::create('/login', 'POST', ['username' => 'testuser', 'password' => 'testpass']);
        $request->setSession($session);

        $this->authClient->method('login')
            ->willReturn(['key' => 'test-token', 'id' => 1, 'expiry_date' => '2026-03-18T14:15:38+04:00']);
        $this->authClient->method('getSessionUser')->willThrowException(new \UnexpectedValueException('bad payload'));

        $response = $this->controller->login($request);

        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertContains('auth_token', $stored);
        $this->assertNotContains('admin_id', $stored);
    }
}
