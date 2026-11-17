<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Picks the UI locale for each request:
 *  1. `?_locale=xx` (if supported) — remembered in the session,
 *  2. the locale stored in the session,
 *  3. the best match from the browser's Accept-Language header,
 *  4. the first supported locale.
 *
 * Runs before Symfony's LocaleAwareListener (priority 15), so the translator picks up the result.
 */
class LocaleSubscriber implements EventSubscriberInterface
{
    public const SESSION_KEY = '_locale';
    private const QUERY_KEY = '_locale';

    /**
     * @param string[] $supportedLocales
     */
    public function __construct(private readonly array $supportedLocales)
    {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 20],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest() || $this->supportedLocales === []) {
            return;
        }

        $request = $event->getRequest();
        if (str_starts_with($request->getPathInfo(), '/api/')) {
            return;
        }

        $request->setLocale($this->resolveLocale($request));
    }

    private function resolveLocale(Request $request): string
    {
        $session = $request->hasSession() ? $request->getSession() : null;

        $requested = $request->query->get(self::QUERY_KEY);
        if (is_string($requested) && $this->isSupported($requested)) {
            $session?->set(self::SESSION_KEY, $requested);
            return $requested;
        }

        $stored = $session?->get(self::SESSION_KEY);
        if (is_string($stored) && $this->isSupported($stored)) {
            return $stored;
        }

        return $request->getPreferredLanguage($this->supportedLocales) ?? $this->supportedLocales[0];
    }

    private function isSupported(string $locale): bool
    {
        return in_array($locale, $this->supportedLocales, true);
    }
}
