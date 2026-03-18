<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\Controller;

use PhpList\RestApiClient\Entity\Administrator;
use PhpList\WebFrontend\Controller\AuthController;
use PhpList\RestApiClient\Endpoint\AuthClient;
use PHPUnit\Framework\Assert;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use RuntimeException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Session\SessionInterface;

class AuthControllerTest extends TestCase
{
    private AuthClient&MockObject $authClient;
    private AuthController $controller;

    protected function setUp(): void
    {
        $this->authClient = $this->createMock(AuthClient::class);

        $this->controller = $this->getMockBuilder(AuthController::class)
            ->setConstructorArgs([$this->authClient])
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
            'Invalid credentials or server error: Invalid credentials',
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

        $response = $this->controller->about();

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(200, $response->getStatusCode());
        $this->assertEquals(
            '{"id":123,"login_name":"testadmin","email":"admin@example.com","super_user":true}',
            $response->getContent()
        );
    }
}
