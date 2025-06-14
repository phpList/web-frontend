<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\Controller;

use PhpList\WebFrontend\Controller\AuthController;
use PhpList\WebFrontend\Service\ApiClient;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use RuntimeException;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Session\SessionInterface;

class AuthControllerTest extends TestCase
{
    private ApiClient&MockObject $apiClient;
    private AuthController $controller;

    protected function setUp(): void
    {
        $this->apiClient = $this->createMock(ApiClient::class);

        $this->controller = $this->getMockBuilder(AuthController::class)
            ->setConstructorArgs([$this->apiClient])
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

        $session->expects($this->exactly(2))
            ->method('set')
            ->withConsecutive(
                ['auth_token', 'test-token'],
                ['auth_expiry_date', 'test-token']
            );

        $request = Request::create('/login', 'POST', [
            'username' => 'testuser',
            'password' => 'testpass',
        ]);
        $request->setSession($session);

        $this->apiClient->method('authenticate')
            ->with('testuser', 'testpass')
            ->willReturn(['key' => 'test-token']);

        $this->apiClient->expects($this->once())
            ->method('setAuthToken')
            ->with('test-token');

        $response = $this->controller->login($request);

        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertStringContainsString('empty_start_page', $response->getTargetUrl());
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

        $this->apiClient->method('authenticate')
            ->with('testuser', 'testpass')
            ->willThrowException(new RuntimeException('Invalid credentials'));

        $response = $this->controller->login($request);

        $this->assertStringContainsString('auth/login.html.twig', $response->getContent());
        $this->assertStringContainsString('Invalid credentials', $response->getContent());
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
        $this->assertStringContainsString('empty_start_page', $response->getTargetUrl());
    }

    public function testLogout(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->expects($this->once())
            ->method('remove')
            ->with('auth_token');

        $request = $this->createMock(Request::class);
        $request->method('getSession')
            ->willReturn($session);

        $response = $this->controller->logout($request);

        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertStringContainsString('login', $response->getTargetUrl());
    }
}
