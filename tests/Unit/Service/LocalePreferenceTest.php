<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\Service;

use PhpList\WebFrontend\Service\LocalePreference;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\HttpFoundation\Session\Storage\MockArraySessionStorage;

class LocalePreferenceTest extends TestCase
{
    private LocalePreference $preference;

    protected function setUp(): void
    {
        $this->preference = new LocalePreference(['en', 'es']);
    }

    public function testDefaultsToTheFirstSupportedLocale(): void
    {
        $this->assertSame('en', $this->preference->resolve($this->request()));
    }

    public function testAnonymousVisitorsGetTheBrowsersLastLanguage(): void
    {
        $request = $this->request(['phplist_locale' => 'es']);

        $this->assertSame('es', $this->preference->resolve($request));
    }

    public function testLoggedInAdministratorGetsTheirOwnLanguageOverTheBrowsersLast(): void
    {
        $request = $this->request(
            ['phplist_locale' => 'es', 'phplist_admin_locales' => '{"7":"en","8":"es"}'],
            adminId: 7
        );

        $this->assertSame('en', $this->preference->resolve($request));
    }

    public function testAdministratorWithoutAChoiceInheritsTheBrowsersLastLanguage(): void
    {
        $request = $this->request(
            ['phplist_locale' => 'es', 'phplist_admin_locales' => '{"8":"en"}'],
            adminId: 7
        );

        $this->assertSame('es', $this->preference->resolve($request));
    }

    public function testIgnoresUnsupportedOrMalformedCookieValues(): void
    {
        $this->assertSame('en', $this->preference->resolve($this->request(['phplist_locale' => '../../etc'])));
        $this->assertSame('en', $this->preference->resolve($this->request(
            ['phplist_admin_locales' => '{"7":"xx"}'],
            adminId: 7
        )));
        $this->assertSame('en', $this->preference->resolve($this->request(
            ['phplist_admin_locales' => 'not json'],
            adminId: 7
        )));
    }

    public function testChoiceByLoggedInAdministratorIsStoredPerAdminAndAsLast(): void
    {
        $request = $this->request(['phplist_admin_locales' => '{"8":"en"}'], adminId: 7);

        $cookies = $this->byName($this->preference->createChoiceCookies($request, 'es'));

        $this->assertSame(['8' => 'en', '7' => 'es'], json_decode($cookies['phplist_admin_locales']->getValue(), true));
        $this->assertSame('es', $cookies['phplist_locale']->getValue());
    }

    public function testChoiceWithoutALoginOnlyUpdatesTheBrowsersLastLanguage(): void
    {
        $cookies = $this->byName($this->preference->createChoiceCookies($this->request(), 'es'));

        $this->assertSame(['phplist_locale'], array_keys($cookies));
    }

    public function testCookiesAreLongLivedHttpOnlyAndLax(): void
    {
        $cookie = $this->preference->createChoiceCookies($this->request(), 'es')[0];

        $this->assertTrue($cookie->isHttpOnly());
        $this->assertSame(Cookie::SAMESITE_LAX, $cookie->getSameSite());
        $this->assertSame('/', $cookie->getPath());
        $this->assertGreaterThan(time() + 300 * 86400, $cookie->getExpiresTime());
    }

    public function testKeepsOnlyTheMostRecentAdministrators(): void
    {
        $existing = [];
        for ($id = 1; $id <= 50; $id++) {
            $existing[$id] = 'en';
        }
        $request = $this->request(['phplist_admin_locales' => json_encode($existing)], adminId: 99);

        $cookies = $this->byName($this->preference->createChoiceCookies($request, 'es'));
        $stored = json_decode($cookies['phplist_admin_locales']->getValue(), true);

        $this->assertCount(50, $stored);
        $this->assertArrayNotHasKey('1', $stored);
        $this->assertSame('es', $stored['99']);
    }

    public function testLoginMakesTheAdministratorsOwnLanguageTheBrowsersLast(): void
    {
        $request = $this->request(
            ['phplist_locale' => 'en', 'phplist_admin_locales' => '{"7":"es"}'],
            adminId: 7
        );

        $cookie = $this->preference->createLoginSyncCookie($request);

        $this->assertSame('phplist_locale', $cookie?->getName());
        $this->assertSame('es', $cookie->getValue());
    }

    public function testNoSyncWhenInSyncOrWhenTheAdministratorHasNoChoice(): void
    {
        $inSync = $this->request(['phplist_locale' => 'es', 'phplist_admin_locales' => '{"7":"es"}'], adminId: 7);
        $noChoice = $this->request(['phplist_locale' => 'es'], adminId: 7);
        $anonymous = $this->request(['phplist_admin_locales' => '{"7":"es"}']);

        $this->assertNull($this->preference->createLoginSyncCookie($inSync));
        $this->assertNull($this->preference->createLoginSyncCookie($noChoice));
        $this->assertNull($this->preference->createLoginSyncCookie($anonymous));
    }

    public function testAdministratorIdIsOnlyUsedWhileLoggedIn(): void
    {
        $request = $this->request(['phplist_admin_locales' => '{"7":"es"}'], adminId: 7);
        $request->getSession()->remove('auth_token');

        $this->assertNull($this->preference->getAdminId($request));
        $this->assertSame('en', $this->preference->resolve($request));
    }

    private function request(array $cookies = [], ?int $adminId = null): Request
    {
        $request = Request::create('/', 'GET', [], $cookies);
        $session = new Session(new MockArraySessionStorage());
        if ($adminId !== null) {
            $session->set('auth_token', 'token');
            $session->set('admin_id', $adminId);
        }
        $request->setSession($session);

        return $request;
    }

    /**
     * @param Cookie[] $cookies
     * @return array<string, Cookie>
     */
    private function byName(array $cookies): array
    {
        $byName = [];
        foreach ($cookies as $cookie) {
            $byName[$cookie->getName()] = $cookie;
        }

        return $byName;
    }
}
