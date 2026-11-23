<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Service;

use Psr\Cache\CacheItemPoolInterface;
use Symfony\Component\HttpFoundation\Request;

/**
 * Fixed-window attempt counter that protects the unauthenticated auth endpoints (login, forgot/reset
 * password) from brute forcing. Counters live in the application cache, keyed by client IP and,
 * where given, by the targeted identifier (e.g. the username) so one account cannot be hammered from many IPs.
 */
class LoginThrottle
{
    public const SCOPE_LOGIN = 'login';
    public const SCOPE_FORGOT_PASSWORD = 'forgot_password';
    public const SCOPE_RESET_PASSWORD = 'reset_password';

    public function __construct(
        private readonly CacheItemPoolInterface $cache,
        private readonly int $maxAttemptsPerIdentifier = 5,
        private readonly int $maxAttemptsPerIp = 20,
        private readonly int $windowSeconds = 900,
    ) {
    }

    public function isBlocked(Request $request, string $scope, string $identifier = ''): bool
    {
        foreach ($this->limits($request, $scope, $identifier) as $key => $limit) {
            $item = $this->cache->getItem($key);
            if ($item->isHit() && (int) $item->get() >= $limit) {
                return true;
            }
        }

        return false;
    }

    /**
     * Counts one attempt. The window starts with the first attempt and is not extended by later ones.
     */
    public function hit(Request $request, string $scope, string $identifier = ''): void
    {
        foreach (array_keys($this->limits($request, $scope, $identifier)) as $key) {
            $item = $this->cache->getItem($key);
            $count = $item->isHit() ? (int) $item->get() : 0;
            if ($count === 0) {
                $item->expiresAfter($this->windowSeconds);
            }
            $item->set($count + 1);
            $this->cache->save($item);
        }
    }

    /**
     * Forgets the per-identifier counter after a successful login. The per-IP counter is kept on purpose.
     */
    public function reset(Request $request, string $scope, string $identifier): void
    {
        $limits = $this->limits($request, $scope, $identifier);
        $identifierKey = array_key_last($limits);
        if ($identifier !== '' && $identifierKey !== null) {
            $this->cache->deleteItem($identifierKey);
        }
    }

    public function getRetryAfterSeconds(): int
    {
        return $this->windowSeconds;
    }

    /**
     * @return array<string, int> cache key => maximum attempts (identifier key, when present, is last)
     */
    private function limits(Request $request, string $scope, string $identifier): array
    {
        $ipKey = 'auth_throttle_ip_' . $scope . '_' . hash('sha256', (string) $request->getClientIp());
        $limits = [$ipKey => $this->maxAttemptsPerIp];

        if ($identifier !== '') {
            $limits['auth_throttle_id_' . $scope . '_' . hash('sha256', mb_strtolower($identifier))]
                = $this->maxAttemptsPerIdentifier;
        }

        return $limits;
    }
}
