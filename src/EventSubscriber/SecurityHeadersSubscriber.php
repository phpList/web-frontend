<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Adds baseline browser hardening headers. The public subscribe/unsubscribe pages may legitimately be
 * embedded in other sites (as in phpList 3), so they are exempt from the framing restrictions.
 */
class SecurityHeadersSubscriber implements EventSubscriberInterface
{
    private const FRAMEABLE_PATH_PREFIXES = ['/subscribe', '/unsubscribe'];

    public static function getSubscribedEvents(): array
    {
        return [KernelEvents::RESPONSE => 'onKernelResponse'];
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $headers = $event->getResponse()->headers;

        $headers->set('X-Content-Type-Options', 'nosniff');
        $headers->set('Referrer-Policy', 'same-origin');

        $directives = ["object-src 'none'", "base-uri 'self'"];
        if (!$this->isFrameable($request->getPathInfo())) {
            $headers->set('X-Frame-Options', 'SAMEORIGIN');
            $directives[] = "frame-ancestors 'self'";
            $directives[] = "form-action 'self'";
        }
        if (!$headers->has('Content-Security-Policy')) {
            $headers->set('Content-Security-Policy', implode('; ', $directives));
        }

        if ($request->isSecure()) {
            $headers->set('Strict-Transport-Security', 'max-age=31536000');
        }
    }

    private function isFrameable(string $path): bool
    {
        $path = (string) preg_replace('#^/(?:app|app_test)\.php#', '', $path, 1);
        foreach (self::FRAMEABLE_PATH_PREFIXES as $prefix) {
            if ($path === $prefix || str_starts_with($path, $prefix . '/')) {
                return true;
            }
        }

        return false;
    }
}
