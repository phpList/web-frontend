<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\Security;

use DateTimeImmutable;
use PhpList\WebFrontend\Security\SessionAuthenticator;
use Psr\Clock\ClockInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\SessionInterface;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\SelfValidatingPassport;

class SessionAuthenticatorTest extends TestCase
{
    private UrlGeneratorInterface|MockObject $urlGenerator;
    private SessionAuthenticator $authenticator;

    protected function setUp(): void
    {
        $this->urlGenerator = $this->createMock(UrlGeneratorInterface::class);
        $this->authenticator = new SessionAuthenticator($this->urlGenerator);
    }

    public function testSupportsReturnsFalseForLoginPath(): void
    {
        $request = Request::create('/login');
        $this->assertFalse($this->authenticator->supports($request));

        $request = Request::create('/login/check');
        $this->assertFalse($this->authenticator->supports($request));

        $request = Request::create('/app_test.php/login');
        $this->assertFalse($this->authenticator->supports($request));

        $request = Request::create('/app.php/login/check');
        $this->assertFalse($this->authenticator->supports($request));
    }

    public function testSupportsReturnsFalseForUnsubscribePaths(): void
    {
        $request = Request::create('/unsubscribe');
        $this->assertFalse($this->authenticator->supports($request));

        $request = Request::create('/unsubscribe/7');
        $this->assertFalse($this->authenticator->supports($request));

        $request = Request::create('/subscribe');
        $this->assertFalse($this->authenticator->supports($request));
    }

    public function testSupportsReturnsTrueForOtherPaths(): void
    {
        $request = Request::create('/dashboard');
        $this->assertTrue($this->authenticator->supports($request));

        $request = Request::create('/');
        $this->assertTrue($this->authenticator->supports($request));
    }

    public function testAuthenticateThrowsExceptionWhenNoSession(): void
    {
        $request = Request::create('/dashboard');
        // Request::create doesn't have a session by default

        $this->expectException(AuthenticationException::class);
        $this->expectExceptionMessage('Session is not available');

        $this->authenticator->authenticate($request);
    }

    public function testAuthenticateThrowsExceptionWhenNoAuthTokenInSession(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->with('auth_token')->willReturn(false);

        $request = Request::create('/dashboard');
        $request->setSession($session);

        $this->expectException(AuthenticationException::class);
        $this->expectExceptionMessage('No auth token in session');

        $this->authenticator->authenticate($request);
    }

    public function testAuthenticateReturnsPassportWhenAuthTokenInSession(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->with('auth_token')->willReturn(true);

        $request = Request::create('/dashboard');
        $request->setSession($session);

        $passport = $this->authenticator->authenticate($request);

        $this->assertInstanceOf(SelfValidatingPassport::class, $passport);
        $this->assertTrue($passport->hasBadge(UserBadge::class));

        $userBadge = $passport->getBadge(UserBadge::class);
        $this->assertEquals('session-user', $userBadge->getUserIdentifier());

        $user = $userBadge->getUser();
        $this->assertEquals(['ROLE_ADMIN'], $user->getRoles());
    }

    public function testOnAuthenticationSuccessReturnsNull(): void
    {
        $request = Request::create('/dashboard');
        $token = $this->createMock(TokenInterface::class);

        $response = $this->authenticator->onAuthenticationSuccess($request, $token, 'main');

        $this->assertNull($response);
    }

    public function testOnAuthenticationFailureRedirectsToLogin(): void
    {
        $this->urlGenerator->method('generate')->with('login')->willReturn('/login');

        $request = Request::create('/dashboard?tab=performance');
        $exception = new AuthenticationException('Auth failed');

        $response = $this->authenticator->onAuthenticationFailure($request, $exception);

        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertEquals('/login?redirect=%2Fdashboard%3Ftab%3Dperformance', $response->getTargetUrl());
    }

    public function testStartRedirectsToLogin(): void
    {
        $this->urlGenerator->method('generate')->with('login')->willReturn('/login');

        $request = Request::create('/dashboard?tab=overview');

        $response = $this->authenticator->start($request);

        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertEquals('/login?redirect=%2Fdashboard%3Ftab%3Doverview', $response->getTargetUrl());
    }

    public function testStartReturnsJsonForXmlHttpRequest(): void
    {
        $this->urlGenerator->method('generate')->with('login')->willReturn('/login');

        $request = Request::create('/subscribers?tab=overview');
        $request->headers->set('X-Requested-With', 'XMLHttpRequest');

        $response = $this->authenticator->start($request);

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(401, $response->getStatusCode());

        $payload = json_decode($response->getContent(), true);
        $this->assertEquals('session_expired', $payload['error']);
        $this->assertEquals('/login?redirect=%2Fsubscribers%3Ftab%3Doverview', $payload['redirect']);
    }

    public function testAuthenticateRejectsAndClearsAnExpiredToken(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->with('auth_token')->willReturn(true);
        $session->method('get')->with('auth_expiry_date')->willReturn('2026-03-18T14:15:38+04:00');

        $removed = [];
        $session->method('remove')->willReturnCallback(function (string $key) use (&$removed): void {
            $removed[] = $key;
        });

        $request = Request::create('/dashboard');
        $request->setSession($session);

        $authenticator = new SessionAuthenticator(
            $this->urlGenerator,
            null,
            $this->clockAt('2026-03-18T10:15:39+00:00')
        );

        try {
            $authenticator->authenticate($request);
            $this->fail('An expired token must not authenticate.');
        } catch (AuthenticationException $exception) {
            $this->assertSame('Authentication token expired', $exception->getMessage());
        }

        // Credentials are dropped so /login does not bounce the browser back into the app.
        $this->assertSame(['auth_token', 'auth_expiry_date', 'auth_id', 'admin_id'], $removed);
    }

    public function testAuthenticateAcceptsATokenThatHasNotExpiredYet(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->with('auth_token')->willReturn(true);
        $session->method('get')->with('auth_expiry_date')->willReturn('2026-03-18T14:15:38+04:00');
        $session->expects($this->never())->method('remove');

        $request = Request::create('/dashboard');
        $request->setSession($session);

        $authenticator = new SessionAuthenticator(
            $this->urlGenerator,
            null,
            $this->clockAt('2026-03-18T10:15:37+00:00')
        );

        $this->assertInstanceOf(SelfValidatingPassport::class, $authenticator->authenticate($request));
    }

    public function testAuthenticateTreatsTheExpiryInstantAsExpired(): void
    {
        $session = $this->createMock(SessionInterface::class);
        $session->method('has')->with('auth_token')->willReturn(true);
        $session->method('get')->with('auth_expiry_date')->willReturn('2026-03-18T14:15:38+04:00');

        $request = Request::create('/dashboard');
        $request->setSession($session);

        $authenticator = new SessionAuthenticator(
            $this->urlGenerator,
            null,
            $this->clockAt('2026-03-18T10:15:38+00:00')
        );

        $this->expectException(AuthenticationException::class);

        $authenticator->authenticate($request);
    }

    public function testAuthenticateDoesNotEnforceMissingOrUnparseableExpiry(): void
    {
        foreach ([null, '', 'not-a-date'] as $expiry) {
            $session = $this->createMock(SessionInterface::class);
            $session->method('has')->with('auth_token')->willReturn(true);
            $session->method('get')->with('auth_expiry_date')->willReturn($expiry);

            $request = Request::create('/dashboard');
            $request->setSession($session);

            $this->assertInstanceOf(SelfValidatingPassport::class, $this->authenticator->authenticate($request));
        }
    }

    private function clockAt(string $now): ClockInterface
    {
        return new class (new DateTimeImmutable($now)) implements ClockInterface {
            public function __construct(private readonly DateTimeImmutable $now)
            {
            }

            public function now(): DateTimeImmutable
            {
                return $this->now;
            }
        };
    }
}
