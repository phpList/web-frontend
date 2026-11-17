<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\EventSubscriber;

use PhpList\WebFrontend\EventSubscriber\LocaleSubscriber;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\HttpFoundation\Session\Storage\MockArraySessionStorage;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\HttpKernel\KernelEvents;

class LocaleSubscriberTest extends TestCase
{
    private LocaleSubscriber $subscriber;

    protected function setUp(): void
    {
        $this->subscriber = new LocaleSubscriber(['en', 'es']);
    }

    public function testRunsBeforeTheTranslatorPicksUpTheRequestLocale(): void
    {
        $events = LocaleSubscriber::getSubscribedEvents();

        // Symfony's LocaleAwareListener (which sets the translator locale) runs at priority 15.
        $this->assertSame(['onKernelRequest', 20], $events[KernelEvents::REQUEST]);
    }

    public function testUsesTheBestMatchFromAcceptLanguage(): void
    {
        $request = $this->createRequest('/', ['HTTP_ACCEPT_LANGUAGE' => 'es-ES,es;q=0.9,en;q=0.8']);

        $this->dispatch($request);

        $this->assertSame('es', $request->getLocale());
    }

    public function testFallsBackToTheFirstSupportedLocale(): void
    {
        $request = $this->createRequest('/', ['HTTP_ACCEPT_LANGUAGE' => 'de-DE,de;q=0.9']);

        $this->dispatch($request);

        $this->assertSame('en', $request->getLocale());
    }

    public function testQueryParameterWinsAndIsRememberedInTheSession(): void
    {
        $request = $this->createRequest('/?_locale=es', ['HTTP_ACCEPT_LANGUAGE' => 'en']);

        $this->dispatch($request);

        $this->assertSame('es', $request->getLocale());
        $this->assertSame('es', $request->getSession()->get(LocaleSubscriber::SESSION_KEY));
    }

    public function testSessionLocaleWinsOverAcceptLanguage(): void
    {
        $request = $this->createRequest('/', ['HTTP_ACCEPT_LANGUAGE' => 'en']);
        $request->getSession()->set(LocaleSubscriber::SESSION_KEY, 'es');

        $this->dispatch($request);

        $this->assertSame('es', $request->getLocale());
    }

    public function testIgnoresUnsupportedLocalesFromQueryAndSession(): void
    {
        $request = $this->createRequest('/?_locale=xx', ['HTTP_ACCEPT_LANGUAGE' => 'es']);
        $request->getSession()->set(LocaleSubscriber::SESSION_KEY, '../../etc');

        $this->dispatch($request);

        $this->assertSame('es', $request->getLocale());
        $this->assertSame('../../etc', $request->getSession()->get(LocaleSubscriber::SESSION_KEY));
    }

    public function testLeavesApiRequestsAlone(): void
    {
        $request = $this->createRequest('/api/v2/sessions', ['HTTP_ACCEPT_LANGUAGE' => 'es']);
        $request->setLocale('en');

        $this->dispatch($request);

        $this->assertSame('en', $request->getLocale());
    }

    public function testIgnoresSubRequests(): void
    {
        $request = $this->createRequest('/', ['HTTP_ACCEPT_LANGUAGE' => 'es']);
        $request->setLocale('en');

        $this->dispatch($request, HttpKernelInterface::SUB_REQUEST);

        $this->assertSame('en', $request->getLocale());
    }

    private function createRequest(string $uri, array $server): Request
    {
        $request = Request::create($uri, 'GET', [], [], [], $server);
        $request->setSession(new Session(new MockArraySessionStorage()));

        return $request;
    }

    private function dispatch(Request $request, int $type = HttpKernelInterface::MAIN_REQUEST): void
    {
        $event = new RequestEvent($this->createMock(HttpKernelInterface::class), $request, $type);
        $this->subscriber->onKernelRequest($event);
    }
}
