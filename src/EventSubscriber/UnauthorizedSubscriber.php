<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\EventSubscriber;

use PhpList\WebFrontend\Trait\LoginUrlBuilderTrait;
use PhpList\WebFrontend\Trait\RedirectValidationTrait;
use PhpList\WebFrontend\Trait\SessionExpiredResponseTrait;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use PhpList\RestApiClient\Exception\AuthenticationException;
use PhpList\RestApiClient\Exception\AuthorizationException;

class UnauthorizedSubscriber implements EventSubscriberInterface
{
    use LoginUrlBuilderTrait;
    use RedirectValidationTrait;
    use SessionExpiredResponseTrait;

    public function __construct(
        private readonly UrlGeneratorInterface $urlGenerator,
    ) {
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

        if ($exception instanceof AuthorizationException) {
            $message = 'Access denied.';

            if ($event->getRequest()->isXmlHttpRequest()) {
                $event->setResponse(new JsonResponse([
                    'error' => 'access_denied',
                    'message' => $message,
                ], 403));

                return;
            }

            $event->setResponse(new Response($message, 403, [
                'Content-Type' => 'text/plain; charset=UTF-8',
            ]));

            return;
        }

        if ($exception instanceof AuthenticationException) {
            $request = $event->getRequest();

            if ($request->hasSession()) {
                $session = $request->getSession();
                $session->invalidate();
            }

            $loginUrl = $this->buildLoginUrl($request->getRequestUri());

            if ($request->isXmlHttpRequest()) {
                $event->setResponse($this->sessionExpiredJsonResponse($loginUrl));

                return;
            }

            if ($request->hasSession()) {
                $session = $request->getSession();

                if (method_exists($session, 'getFlashBag')) {
                    $session->getFlashBag()->add('error', 'Your session has expired. Please log in again.');
                }
            }

            $event->setResponse(new RedirectResponse($loginUrl));
        }
    }
}
