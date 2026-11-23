<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Trait;

trait RedirectValidationTrait
{
    private function isSafeRedirectTarget(string $target): bool
    {
        // Browsers treat "\" like "/", so "/\evil.com" is a protocol-relative URL. Control characters
        // (tab, CR, LF, ...) are stripped by browsers while parsing, so "/\t/evil.com" becomes "//evil.com".
        if (preg_match('/[\x5C\x00-\x1F\x7F]/', $target) === 1) {
            return false;
        }

        if (!str_starts_with($target, '/') || str_starts_with($target, '//')) {
            return false;
        }

        $parts = parse_url($target);
        if ($parts === false || isset($parts['scheme']) || isset($parts['host'])) {
            return false;
        }

        $path = $parts['path'] ?? null;
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
