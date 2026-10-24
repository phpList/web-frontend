<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Trait;

use Symfony\Component\HttpFoundation\JsonResponse;

trait SessionExpiredResponseTrait
{
    private function sessionExpiredJsonResponse(string $loginUrl): JsonResponse
    {
        return new JsonResponse([
            'error' => 'session_expired',
            'message' => 'Your session has expired. Please log in again.',
            'redirect' => $loginUrl,
        ], 401);
    }
}
