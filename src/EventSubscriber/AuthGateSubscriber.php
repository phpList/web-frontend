<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\EventSubscriber;

use PhpList\WebFrontend\Trait\RedirectValidationTrait;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;

/**
 * Temporary auth gate until Symfony SecurityBundle is active at runtime.
 *
 * Redirects all anonymous requests to the login page, except explicitly public paths.
 */
class AuthGateSubscriber implements EventSubscriberInterface
{
    use RedirectValidationTrait;

    private const ALLOW_LIST = [
        '/api/v2',
        '/subscribe/',
        '/unsubscribe/',
        '/build/',
        '/assets/',
        '/css/',
        '/js/',
        '/images/',
        '/img/',
        '/favicon',
        '/robots.txt',
    ];

    public function __construct(private readonly UrlGeneratorInterface $urlGenerator)
    {
    }

    public static function getSubscribedEvents(): array
    {
        // Run early in the request, after routing is available is not required here
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 8],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        if ($this->isPublicPath($request)) {
            return;
        }

        $session = $request->getSession();
        if (!$session->has('auth_token')) {
            $loginUrl = $this->buildLoginUrl($request);
            $event->setResponse(new RedirectResponse($loginUrl));
        }
    }

    private function isPublicPath(Request $request): bool
    {
        $path = $this->normalizePath($request->getPathInfo());

        // Public login route
        if ($path === '/login' || str_starts_with($path, '/login')) {
            return true;
        }

        // Allow Symfony debug/profiler and WDT if present
        if (str_starts_with($path, '/_profiler') || str_starts_with($path, '/_wdt')) {
            return true;
        }

        // Allow static assets commonly served under these prefixes
        foreach (self::ALLOW_LIST as $prefix) {
            if ($this->matchesPrefix($path, $prefix)) {
                return true;
            }
        }

        return false;
    }

    private function buildLoginUrl(Request $request): string
    {
        $loginUrl = $this->urlGenerator->generate('login');
        $redirectTarget = $request->getRequestUri();

        if (!$this->isSafeRedirectTarget($redirectTarget)) {
            return $loginUrl;
        }

        return $loginUrl . '?' . http_build_query(['redirect' => $redirectTarget]);
    }

    private function matchesPrefix(string $path, string $prefix): bool
    {
        if (str_ends_with($prefix, '/')) {
            $exactPath = rtrim($prefix, '/');
            return $path === $exactPath || str_starts_with($path, $prefix);
        }

        return str_starts_with($path, $prefix);
    }
}
