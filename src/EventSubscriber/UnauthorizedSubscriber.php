<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use GuzzleHttp\Exception\ClientException;

class UnauthorizedSubscriber implements EventSubscriberInterface
{
    private UrlGeneratorInterface $urlGenerator;

    public function __construct(UrlGeneratorInterface $urlGenerator)
    {
        $this->urlGenerator = $urlGenerator;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::EXCEPTION => 'onKernelException',
        ];
    }

    public function onKernelException(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();

        if ($exception instanceof ClientException && $exception->getCode() === 401) {
            $request = $event->getRequest();
            $session = $request->getSession();

            if ($session->has('auth_token')) {
                $session->remove('auth_token');
            }

            $session->set('login_error', 'Your session has expired. Please log in again.');

            $loginUrl = $this->urlGenerator->generate('login');
            $response = new RedirectResponse($loginUrl);

            $event->setResponse($response);
        }
    }
}
