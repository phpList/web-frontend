<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\EventListener;

use PhpList\RestApiClient\Client;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class ApiSessionListener implements EventSubscriberInterface
{
    public function __construct(private readonly Client $apiClient)
    {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => ['onKernelRequest', 10],
        ];
    }

    public function onKernelRequest(RequestEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        if (!$request->hasSession()) {
            return;
        }

        $session = $request->getSession();
        $authToken = $session->get('auth_token');

        if ($authToken) {
            $this->apiClient->setSessionId($authToken);
        }
    }
}
