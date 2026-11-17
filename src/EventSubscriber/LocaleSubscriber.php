<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\EventSubscriber;

use PhpList\WebFrontend\Service\LocalePreference;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * Applies the browser's remembered UI language (see LocalePreference) to every page request.
 *
 * Runs before Symfony's LocaleAwareListener (priority 15), so the translator picks up the result.
 */
class LocaleSubscriber implements EventSubscriberInterface
{
    public function __construct(private readonly LocalePreference $preference)
    {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 20],
            KernelEvents::RESPONSE => ['onKernelResponse', 0],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest() || $this->isApiRequest($event->getRequest())) {
            return;
        }

        $request = $event->getRequest();
        $request->setLocale($this->preference->resolve($request));
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        $request = $event->getRequest();
        if (!$event->isMainRequest() || $this->isApiRequest($request)) {
            return;
        }

        $response = $event->getResponse();
        foreach ($response->headers->getCookies() as $cookie) {
            if ($cookie->getName() === LocalePreference::LAST_COOKIE) {
                // The response already records an explicit choice.
                return;
            }
        }

        $cookie = $this->preference->createLoginSyncCookie($request);
        if ($cookie !== null) {
            $response->headers->setCookie($cookie);
        }
    }

    private function isApiRequest(Request $request): bool
    {
        return str_starts_with($request->getPathInfo(), '/api/');
    }
}
