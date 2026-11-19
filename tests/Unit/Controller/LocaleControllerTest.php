<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\Controller;

use PhpList\WebFrontend\Controller\LocaleController;
use PhpList\WebFrontend\Service\LocalePreference;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\HttpFoundation\Session\Storage\MockArraySessionStorage;

class LocaleControllerTest extends TestCase
{
    private LocaleController $controller;

    protected function setUp(): void
    {
        $this->controller = new LocaleController(new LocalePreference(['en', 'es']));
    }

    public function testRecordsTheChoiceForTheLoggedInAdministrator(): void
    {
        $response = $this->controller->set($this->request('{"locale":"es"}', adminId: 7));

        $this->assertSame(204, $response->getStatusCode());
        $cookies = [];
        foreach ($response->headers->getCookies() as $cookie) {
            $cookies[$cookie->getName()] = $cookie->getValue();
        }
        $this->assertSame('es', $cookies['phplist_locale']);
        $this->assertSame(['7' => 'es'], json_decode($cookies['phplist_admin_locales'], true));
    }

    public function testRejectsUnsupportedOrMissingLocales(): void
    {
        foreach (['{"locale":"xx"}', '{"locale":5}', '{}', 'nope'] as $body) {
            $response = $this->controller->set($this->request($body, adminId: 7));

            $this->assertSame(400, $response->getStatusCode(), $body);
            $this->assertCount(0, $response->headers->getCookies(), $body);
        }
    }

    public function testRequiresAJsonBody(): void
    {
        $request = Request::create('/locale', 'POST', ['locale' => 'es']);
        $request->setSession(new Session(new MockArraySessionStorage()));

        $this->assertSame(415, $this->controller->set($request)->getStatusCode());
    }

    private function request(string $body, int $adminId): Request
    {
        $request = Request::create('/locale', 'POST', [], [], [], ['CONTENT_TYPE' => 'application/json'], $body);
        $session = new Session(new MockArraySessionStorage());
        $session->set('auth_token', 'token');
        $session->set('admin_id', $adminId);
        $request->setSession($session);

        return $request;
    }
}
