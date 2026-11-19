<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Service;

use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Request;

/**
 * Remembers the UI language in the browser (cookies), per administrator.
 *
 *  - `phplist_admin_locales`: JSON map {administratorId: locale}, one entry per administrator who
 *    picked a language in this browser, so several people can share a browser.
 *  - `phplist_locale`: the language of the last administrator who picked one or logged in. It is
 *    used wherever nobody is logged in yet (the login page) and for administrators who have not
 *    picked a language themselves.
 */
class LocalePreference
{
    public const LAST_COOKIE = 'phplist_locale';
    public const ADMINS_COOKIE = 'phplist_admin_locales';

    private const MAX_ADMINS = 50;
    private const LIFETIME = '+1 year';

    /**
     * @param string[] $supportedLocales the first one is the default
     */
    public function __construct(private readonly array $supportedLocales)
    {
    }

    /**
     * @return string[]
     */
    public function getSupportedLocales(): array
    {
        return $this->supportedLocales;
    }

    public function isSupported(string $locale): bool
    {
        return in_array($locale, $this->supportedLocales, true);
    }

    public function getDefaultLocale(): string
    {
        return $this->supportedLocales[0] ?? 'en';
    }

    /**
     * The language for this request: the logged-in administrator's own choice, else the language
     * of the last administrator in this browser, else the default.
     */
    public function resolve(Request $request): string
    {
        $adminId = $this->getAdminId($request);
        if ($adminId !== null) {
            $own = $this->getAdminLocales($request)[$adminId] ?? null;
            if ($own !== null) {
                return $own;
            }
        }

        return $this->getLastLocale($request) ?? $this->getDefaultLocale();
    }

    /**
     * Cookies that record $locale as the choice of the current administrator (if any) and as the
     * browser's most recent one.
     *
     * @return Cookie[]
     */
    public function createChoiceCookies(Request $request, string $locale): array
    {
        $adminId = $this->getAdminId($request);
        $cookies = [];

        if ($adminId !== null) {
            $admins = $this->getAdminLocales($request);
            unset($admins[$adminId]);
            // Most recently changed goes last, so trimming drops the oldest.
            $admins[$adminId] = $locale;
            $admins = array_slice($admins, -self::MAX_ADMINS, null, true);

            $cookies[] = $this->createCookie($request, self::ADMINS_COOKIE, (string) json_encode((object) $admins));
        }

        $cookies[] = $this->createCookie($request, self::LAST_COOKIE, $locale);

        return $cookies;
    }

    /**
     * After logging in, the browser's "last" language becomes that administrator's own one.
     * Returns null when nothing needs to change (no choice stored yet, or already in sync).
     */
    public function createLoginSyncCookie(Request $request): ?Cookie
    {
        $adminId = $this->getAdminId($request);
        $own = $adminId === null ? null : ($this->getAdminLocales($request)[$adminId] ?? null);

        if ($own === null || $own === $this->getLastLocale($request)) {
            return null;
        }

        return $this->createCookie($request, self::LAST_COOKIE, $own);
    }

    /**
     * The administrator id stored in the session at login, or null when nobody is logged in.
     */
    public function getAdminId(Request $request): ?int
    {
        if (!$request->hasSession()) {
            return null;
        }

        $session = $request->getSession();
        if (!$session->has('auth_token')) {
            return null;
        }

        $adminId = (int) $session->get('admin_id');

        return $adminId > 0 ? $adminId : null;
    }

    private function getLastLocale(Request $request): ?string
    {
        $locale = $request->cookies->get(self::LAST_COOKIE);

        return is_string($locale) && $this->isSupported($locale) ? $locale : null;
    }

    /**
     * @return array<int, string>
     */
    private function getAdminLocales(Request $request): array
    {
        $decoded = json_decode((string) $request->cookies->get(self::ADMINS_COOKIE, ''), true);
        if (!is_array($decoded)) {
            return [];
        }

        $locales = [];
        foreach ($decoded as $adminId => $locale) {
            if ((int) $adminId > 0 && is_string($locale) && $this->isSupported($locale)) {
                $locales[(int) $adminId] = $locale;
            }
        }

        return $locales;
    }

    private function createCookie(Request $request, string $name, string $value): Cookie
    {
        return Cookie::create(
            name: $name,
            value: $value,
            expire: new \DateTimeImmutable(self::LIFETIME),
            path: '/',
            secure: $request->isSecure(),
            httpOnly: true,
            sameSite: Cookie::SAMESITE_LAX,
        );
    }
}
