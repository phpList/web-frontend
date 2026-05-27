<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\EventSubscriber;

use PhpList\WebFrontend\EventSubscriber\AuthGateSubscriber;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\SessionInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

class AuthGateSubscriberTest extends TestCase
{
    private UrlGeneratorInterface&MockObject $urlGenerator;
    private AuthGateSubscriber $subscriber;

    protected function setUp(): void
    {
        $this->urlGenerator = $this->createMock(UrlGeneratorInterface::class);
        $this->subscriber = new AuthGateSubscriber($this->urlGenerator);
    }

    public function testRedirectsAnonymousUserToLoginWithOriginalPath(): void
    {
        $this->urlGenerator->method('generate')->with('login')->willReturn('/login');

        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->with('auth_token')->willReturn(false);

        $request = Request::create('/lists/12/subscribers?page=2');
        $request->setSession($session);

        $event = new RequestEvent(
            $this->createMock(HttpKernelInterface::class),
            $request,
            HttpKernelInterface::MAIN_REQUEST
        );

        $this->subscriber->onKernelRequest($event);

        $response = $event->getResponse();
        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertSame('/login?redirect=%2Flists%2F12%2Fsubscribers%3Fpage%3D2', $response->getTargetUrl());
    }

    public function testSkipsRedirectForLoginPage(): void
    {
        $session = $this->createMock(SessionInterface::class);

        $request = Request::create('/login');
        $request->setSession($session);

        $event = new RequestEvent(
            $this->createMock(HttpKernelInterface::class),
            $request,
            HttpKernelInterface::MAIN_REQUEST
        );

        $this->subscriber->onKernelRequest($event);

        $this->assertNull($event->getResponse());
    }

    public function testSkipsRedirectForPublicSubscribePage(): void
    {
        $session = $this->createMock(SessionInterface::class);

        $request = Request::create('/subscribe/7');
        $request->setSession($session);

        $event = new RequestEvent(
            $this->createMock(HttpKernelInterface::class),
            $request,
            HttpKernelInterface::MAIN_REQUEST
        );

        $this->subscriber->onKernelRequest($event);

        $this->assertNull($event->getResponse());
    }
}
