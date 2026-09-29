<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Trait;

trait LoginUrlBuilderTrait
{
    private function buildLoginUrl(string $redirectTarget): string
    {
        $loginUrl = $this->urlGenerator->generate('login');

        if (!$this->isSafeRedirectTarget($redirectTarget)) {
            return $loginUrl;
        }

        return $loginUrl . '?' . http_build_query(['redirect' => $redirectTarget]);
    }
}
