<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\EventSubscriber;

use Exception;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Psr7\Request as GuzzleRequest;
use GuzzleHttp\Psr7\Response as GuzzleResponse;
use PhpList\WebFrontend\EventSubscriber\UnauthorizedSubscriber;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\SessionInterface;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

class UnauthorizedSubscriberTest extends TestCase
{
    private UnauthorizedSubscriber $subscriber;
    private UrlGeneratorInterface&MockObject $urlGenerator;

    protected function setUp(): void
    {
        $this->urlGenerator = $this->createMock(UrlGeneratorInterface::class);
        $this->subscriber = new UnauthorizedSubscriber($this->urlGenerator);
    }

    public function testGetSubscribedEvents(): void
    {
        $events = UnauthorizedSubscriber::getSubscribedEvents();

        $this->assertArrayHasKey(KernelEvents::EXCEPTION, $events);
        $this->assertEquals('onKernelException', $events[KernelEvents::EXCEPTION]);
    }

    public function testOnKernelExceptionWithUnauthorizedException(): void
    {
        $guzzleRequest = new GuzzleRequest('GET', 'http://example.com');
        $guzzleResponse = new GuzzleResponse(401);
        $clientException = new ClientException('Unauthorized', $guzzleRequest, $guzzleResponse);

        $session = $this->createMock(SessionInterface::class);
        $session->expects($this->once())
            ->method('has')
            ->with('auth_token')
            ->willReturn(true);

        $session->expects($this->once())
            ->method('remove')
            ->with('auth_token');

        $session->expects($this->once())
            ->method('set')
            ->with('login_error', 'Your session has expired. Please log in again.');

        $request = $this->createMock(Request::class);
        $request->method('getSession')->willReturn($session);

        $kernel = $this->createMock(HttpKernelInterface::class);
        $event = new ExceptionEvent(
            $kernel,
            $request,
            HttpKernelInterface::MAIN_REQUEST,
            $clientException
        );

        $loginUrl = '/login';
        $this->urlGenerator->method('generate')
            ->with('login')
            ->willReturn($loginUrl);

        $this->subscriber->onKernelException($event);

        $response = $event->getResponse();
        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertEquals($loginUrl, $response->getTargetUrl());
    }

    public function testOnKernelExceptionWithOtherException(): void
    {
        $exception = new Exception('Some other error');

        $request = $this->createMock(Request::class);

        $kernel = $this->createMock(HttpKernelInterface::class);
        $event = new ExceptionEvent(
            $kernel,
            $request,
            HttpKernelInterface::MAIN_REQUEST,
            $exception
        );

        $this->subscriber->onKernelException($event);

        $this->assertNull($event->getResponse());
    }

    public function testOnKernelExceptionWithNonAuthTokenSession(): void
    {
        $guzzleRequest = new GuzzleRequest('GET', 'http://example.com');
        $guzzleResponse = new GuzzleResponse(401);
        $clientException = new ClientException('Unauthorized', $guzzleRequest, $guzzleResponse);

        $session = $this->createMock(SessionInterface::class);
        $session->expects($this->once())
            ->method('has')
            ->with('auth_token')
            ->willReturn(false);

        $session->expects($this->never())
            ->method('remove')
            ->with('auth_token');

        $session->expects($this->once())
            ->method('set')
            ->with('login_error', 'Your session has expired. Please log in again.');

        $request = $this->createMock(Request::class);
        $request->method('getSession')->willReturn($session);

        $kernel = $this->createMock(HttpKernelInterface::class);
        $event = new ExceptionEvent(
            $kernel,
            $request,
            HttpKernelInterface::MAIN_REQUEST,
            $clientException
        );

        $loginUrl = '/login';
        $this->urlGenerator->method('generate')
            ->with('login')
            ->willReturn($loginUrl);

        $this->subscriber->onKernelException($event);

        $response = $event->getResponse();
        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertEquals($loginUrl, $response->getTargetUrl());
    }
}
