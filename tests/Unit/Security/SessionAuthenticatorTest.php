<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\Security;

use PhpList\WebFrontend\Security\SessionAuthenticator;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
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
        
        $request = Request::create('/dashboard');
        $exception = new AuthenticationException('Auth failed');
        
        $response = $this->authenticator->onAuthenticationFailure($request, $exception);
        
        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertEquals('/login', $response->getTargetUrl());
    }

    public function testStartRedirectsToLogin(): void
    {
        $this->urlGenerator->method('generate')->with('login')->willReturn('/login');
        
        $request = Request::create('/dashboard');
        
        $response = $this->authenticator->start($request);
        
        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertEquals('/login', $response->getTargetUrl());
    }
}
