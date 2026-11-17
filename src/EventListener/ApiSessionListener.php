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

        // TODO: pass the resolved UI locale ($request->getLocale(), set by LocaleSubscriber) to the REST API
        //  (e.g. an Accept-Language header on every request made by $this->apiClient) so the data it returns
        //  can be translated into the administrator's language too. Needs support in rest-api-client and rest-api.
        $session = $request->getSession();
        $authToken = $session->get('auth_token');

        if ($authToken) {
            $this->apiClient->setSessionId((string) $authToken);
        }

        $authId = $session->get('auth_id');
        if ($authId) {
            $this->apiClient->setId((int) $authId);
        }
    }
}
