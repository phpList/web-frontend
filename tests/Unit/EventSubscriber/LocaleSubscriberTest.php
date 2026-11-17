<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\EventSubscriber;

use PhpList\WebFrontend\EventSubscriber\LocaleSubscriber;
use PhpList\WebFrontend\Service\LocalePreference;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\HttpFoundation\Session\Storage\MockArraySessionStorage;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\HttpKernel\KernelEvents;

class LocaleSubscriberTest extends TestCase
{
    private LocaleSubscriber $subscriber;

    protected function setUp(): void
    {
        $this->subscriber = new LocaleSubscriber(new LocalePreference(['en', 'es']));
    }

    public function testRunsBeforeTheTranslatorPicksUpTheRequestLocale(): void
    {
        $events = LocaleSubscriber::getSubscribedEvents();

        // Symfony's LocaleAwareListener (which sets the translator locale) runs at priority 15.
        $this->assertSame(['onKernelRequest', 20], $events[KernelEvents::REQUEST]);
    }

    public function testAppliesTheRememberedLanguageToPageRequests(): void
    {
        $request = $this->request('/login', ['phplist_locale' => 'es']);

        $this->dispatchRequest($request);

        $this->assertSame('es', $request->getLocale());
    }

    public function testUsesTheLoggedInAdministratorsOwnLanguage(): void
    {
        $request = $this->request(
            '/',
            ['phplist_locale' => 'en', 'phplist_admin_locales' => '{"7":"es"}'],
            adminId: 7
        );

        $this->dispatchRequest($request);

        $this->assertSame('es', $request->getLocale());
    }

    public function testLeavesApiRequestsAndSubRequestsAlone(): void
    {
        $api = $this->request('/api/v2/sessions', ['phplist_locale' => 'es']);
        $api->setLocale('en');
        $this->dispatchRequest($api);

        $sub = $this->request('/', ['phplist_locale' => 'es']);
        $sub->setLocale('en');
        $this->dispatchRequest($sub, HttpKernelInterface::SUB_REQUEST);

        $this->assertSame('en', $api->getLocale());
        $this->assertSame('en', $sub->getLocale());
    }

    public function testLoginSyncsTheBrowsersLastLanguageToTheAdministratorsOwn(): void
    {
        $request = $this->request(
            '/',
            ['phplist_locale' => 'en', 'phplist_admin_locales' => '{"7":"es"}'],
            adminId: 7
        );

        $response = $this->dispatchResponse($request, new Response());

        $cookies = $response->headers->getCookies();
        $this->assertCount(1, $cookies);
        $this->assertSame('phplist_locale', $cookies[0]->getName());
        $this->assertSame('es', $cookies[0]->getValue());
    }

    public function testDoesNotOverrideACookieTheResponseAlreadySets(): void
    {
        $request = $this->request(
            '/locale',
            ['phplist_locale' => 'en', 'phplist_admin_locales' => '{"7":"en"}'],
            adminId: 7
        );
        $response = new Response();
        $response->headers->setCookie(Cookie::create('phplist_locale', 'es'));

        $this->dispatchResponse($request, $response);

        $cookies = $response->headers->getCookies();
        $this->assertCount(1, $cookies);
        $this->assertSame('es', $cookies[0]->getValue());
    }

    private function request(string $uri, array $cookies = [], ?int $adminId = null): Request
    {
        $request = Request::create($uri, 'GET', [], $cookies);
        $session = new Session(new MockArraySessionStorage());
        if ($adminId !== null) {
            $session->set('auth_token', 'token');
            $session->set('admin_id', $adminId);
        }
        $request->setSession($session);

        return $request;
    }

    private function dispatchRequest(Request $request, int $type = HttpKernelInterface::MAIN_REQUEST): void
    {
        $this->subscriber->onKernelRequest(
            new RequestEvent($this->createMock(HttpKernelInterface::class), $request, $type)
        );
    }

    private function dispatchResponse(Request $request, Response $response): Response
    {
        $this->subscriber->onKernelResponse(
            new ResponseEvent(
                $this->createMock(HttpKernelInterface::class),
                $request,
                HttpKernelInterface::MAIN_REQUEST,
                $response
            )
        );

        return $response;
    }
}
