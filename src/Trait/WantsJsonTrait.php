<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Trait;

use Symfony\Component\HttpFoundation\Request;

trait WantsJsonTrait
{
    private function wantsJson(Request $request): bool
    {
        $accept = (string) $request->headers->get('Accept', '');

        return $request->isXmlHttpRequest() || str_contains($accept, 'application/json');
    }
}
