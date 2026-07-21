<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\EventSubscriber;

use PhpList\RestApiClient\Exception\ApiException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class ApiExceptionSubscriber
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
        // An ApiException whose status is a transport failure (code 0) or a 5xx means the
        // upstream REST API failed or was unreachable. Surface that as a 502 Bad Gateway
        // rather than letting it fall through to a generic 500, which would wrongly imply the
        // fault is in this frontend. Client-shaped subclasses (NotFoundException 404,
        // ValidationException 400/422) carry their own status and are left untouched here.
        if ($exception instanceof ApiException && $this->isUpstreamFailure($exception)) {
            $message = 'The upstream service is currently unavailable. Please try again later.';

            if ($event->getRequest()->isXmlHttpRequest()) {
                $event->setResponse(new JsonResponse([
                    'error' => 'upstream_unavailable',
                    'message' => $message,
                ], Response::HTTP_BAD_GATEWAY));

                return;
            }

            $event->setResponse(new Response($message, Response::HTTP_BAD_GATEWAY, [
                'Content-Type' => 'text/plain; charset=UTF-8',
            ]));
        }
    }

    private function isUpstreamFailure(ApiException $exception): bool
    {
        $statusCode = $exception->getStatusCode();

        // Code 0 is a transport error (connection refused/timeout); >= 500 is an upstream 5xx.
        return $statusCode === 0 || $statusCode >= 500;
    }
}
