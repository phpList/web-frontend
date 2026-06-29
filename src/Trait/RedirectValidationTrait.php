<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Trait;

trait RedirectValidationTrait
{
    private function isSafeRedirectTarget(string $target): bool
    {
        if (!str_starts_with($target, '/') || str_starts_with($target, '//')) {
            return false;
        }

        $path = parse_url($target, PHP_URL_PATH);
        if (!is_string($path)) {
            return false;
        }

        $normalizedPath = $this->normalizePath($path);

        return $normalizedPath !== '/login' && !str_starts_with($normalizedPath, '/login');
    }

    private function normalizePath(string $path): string
    {
        return (string) preg_replace('#^/(?:app|app_test)\.php#', '', $path, 1);
    }
}
