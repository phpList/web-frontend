<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\EventSubscriber;

use Exception;
use PhpList\RestApiClient\Exception\AuthenticationException;
use PhpList\WebFrontend\EventSubscriber\UnauthorizedSubscriber;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\Flash\FlashBagInterface;
use Symfony\Component\HttpFoundation\Session\Session;
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
        $authException = new AuthenticationException('Unauthorized');

        $flashBag = $this->createMock(FlashBagInterface::class);
        $flashBag->expects($this->once())
            ->method('add')
            ->with('error', 'Your session has expired. Please log in again.');

        $session = $this->createMock(Session::class);
        $session->expects($this->once())->method('invalidate');
        $session->method('getFlashBag')->willReturn($flashBag);

        $request = $this->createMock(Request::class);
        $request->method('hasSession')->willReturn(true);
        $request->method('getSession')->willReturn($session);

        $kernel = $this->createMock(HttpKernelInterface::class);
        $event = new ExceptionEvent(
            $kernel,
            $request,
            HttpKernelInterface::MAIN_REQUEST,
            $authException
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

    public function testOnKernelExceptionWithXmlHttpRequest(): void
    {
        $authException = new AuthenticationException('Unauthorized');

        $session = $this->createMock(SessionInterface::class);
        $session->expects($this->once())->method('invalidate');

        $request = $this->createMock(Request::class);
        $request->method('hasSession')->willReturn(true);
        $request->method('getSession')->willReturn($session);
        $request->method('isXmlHttpRequest')->willReturn(true);

        $kernel = $this->createMock(HttpKernelInterface::class);
        $event = new ExceptionEvent(
            $kernel,
            $request,
            HttpKernelInterface::MAIN_REQUEST,
            $authException
        );

        $loginUrl = '/login';
        $this->urlGenerator->method('generate')
            ->with('login')
            ->willReturn($loginUrl);

        $this->subscriber->onKernelException($event);

        $response = $event->getResponse();
        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(401, $response->getStatusCode());

        $data = json_decode($response->getContent(), true);
        $this->assertEquals('session_expired', $data['error']);
        $this->assertEquals($loginUrl, $data['redirect']);
    }

    public function testOnKernelExceptionWithoutSession(): void
    {
        $authException = new AuthenticationException('Unauthorized');

        $request = $this->createMock(Request::class);
        $request->method('hasSession')->willReturn(false);

        $kernel = $this->createMock(HttpKernelInterface::class);
        $event = new ExceptionEvent(
            $kernel,
            $request,
            HttpKernelInterface::MAIN_REQUEST,
            $authException
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
