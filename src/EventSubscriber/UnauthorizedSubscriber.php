<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use GuzzleHttp\Exception\ClientException;

class UnauthorizedSubscriber implements EventSubscriberInterface
{
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
            // Redirect to login page or handle unauthorized access
        }
    }
}
