<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Security;

use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\User\InMemoryUser;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;
use Symfony\Component\Security\Http\EntryPoint\AuthenticationEntryPointInterface;

class SessionAuthenticator extends AbstractAuthenticator implements AuthenticationEntryPointInterface
{
    private const NOT_SUPPORTED_PATHS = [
        '/login',
        '/_profiler',
        '/_wdt',
        '/build/',
        '/assets/',
        '/css/',
        '/js/',
        '/images/',
        '/img/',
        '/favicon',
        '/robots.txt',
    ];

    public function __construct(private readonly UrlGeneratorInterface $urlGenerator)
    {
    }

    public function supports(Request $request): ?bool
    {
        $path = $this->normalizePath($request->getPathInfo());
        foreach (self::NOT_SUPPORTED_PATHS as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return false;
            }
        }

        return true;
    }

    private function normalizePath(string $path): string
    {
        return (string) preg_replace('#^/(?:app|app_test)\.php#', '', $path, 1);
    }

    public function authenticate(Request $request): Passport
    {
        if (!$request->hasSession()) {
            throw new AuthenticationException('Session is not available');
        }
        $session = $request->getSession();

        if ($session->has('auth_token')) {
            // Build a simple user granted ROLE_ADMIN when a session token exists
            $userBadge = new UserBadge('session-user', function (): InMemoryUser {
                return new InMemoryUser('session-user', '', ['ROLE_ADMIN']);
            });

            return new SelfValidatingPassport($userBadge);
        }

        throw new AuthenticationException('No auth token in session');
    }

    public function onAuthenticationSuccess(Request $request, TokenInterface $token, string $firewallName): ?Response
    {
        return null;
    }

    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): ?Response
    {
        return $this->start($request, $exception);
    }

    public function start(Request $request, AuthenticationException $authException = null): Response
    {
        $loginUrl = $this->urlGenerator->generate('login');
        return new RedirectResponse($loginUrl);
    }
}
