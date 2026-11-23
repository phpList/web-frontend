<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\Service;

use PhpList\WebFrontend\Service\LoginThrottle;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Cache\Adapter\ArrayAdapter;
use Symfony\Component\HttpFoundation\Request;

class LoginThrottleTest extends TestCase
{
    private function request(string $ip = '10.0.0.1'): Request
    {
        return Request::create('/login', 'POST', [], [], [], ['REMOTE_ADDR' => $ip]);
    }

    public function testNotBlockedInitially(): void
    {
        $throttle = new LoginThrottle(new ArrayAdapter(), 2, 10);

        $this->assertFalse($throttle->isBlocked($this->request(), LoginThrottle::SCOPE_LOGIN, 'admin'));
    }

    public function testBlocksIdentifierAfterLimit(): void
    {
        $throttle = new LoginThrottle(new ArrayAdapter(), 2, 10);

        $throttle->hit($this->request(), LoginThrottle::SCOPE_LOGIN, 'admin');
        $this->assertFalse($throttle->isBlocked($this->request(), LoginThrottle::SCOPE_LOGIN, 'admin'));
        $throttle->hit($this->request(), LoginThrottle::SCOPE_LOGIN, 'admin');

        $this->assertTrue($throttle->isBlocked($this->request(), LoginThrottle::SCOPE_LOGIN, 'admin'));
        $this->assertTrue($throttle->isBlocked($this->request('10.9.9.9'), LoginThrottle::SCOPE_LOGIN, 'ADMIN'));
        $this->assertFalse(
            $throttle->isBlocked(
                $this->request('10.9.9.9'),
                LoginThrottle::SCOPE_LOGIN,
                'someone-else'
            )
        );
    }

    public function testBlocksIpAfterLimitAcrossIdentifiers(): void
    {
        $throttle = new LoginThrottle(new ArrayAdapter(), 5, 3);

        foreach (['a', 'b', 'c'] as $name) {
            $throttle->hit($this->request(), LoginThrottle::SCOPE_LOGIN, $name);
        }

        $this->assertTrue($throttle->isBlocked($this->request(), LoginThrottle::SCOPE_LOGIN, 'd'));
        $this->assertFalse($throttle->isBlocked($this->request('10.0.0.2'), LoginThrottle::SCOPE_LOGIN, 'd'));
    }

    public function testScopesAreIndependent(): void
    {
        $throttle = new LoginThrottle(new ArrayAdapter(), 1, 1);
        $throttle->hit($this->request(), LoginThrottle::SCOPE_LOGIN, 'admin');

        $this->assertTrue($throttle->isBlocked($this->request(), LoginThrottle::SCOPE_LOGIN, 'admin'));
        $this->assertFalse($throttle->isBlocked($this->request(), LoginThrottle::SCOPE_FORGOT_PASSWORD, 'admin'));
    }

    public function testResetClearsIdentifierCounterButKeepsIpCounter(): void
    {
        $throttle = new LoginThrottle(new ArrayAdapter(), 2, 3);
        $throttle->hit($this->request(), LoginThrottle::SCOPE_LOGIN, 'admin');
        $throttle->hit($this->request(), LoginThrottle::SCOPE_LOGIN, 'admin');
        $this->assertTrue($throttle->isBlocked($this->request('10.0.0.5'), LoginThrottle::SCOPE_LOGIN, 'admin'));

        $throttle->reset($this->request(), LoginThrottle::SCOPE_LOGIN, 'admin');

        $this->assertFalse(
            $throttle->isBlocked(
                $this->request('10.0.0.5'),
                LoginThrottle::SCOPE_LOGIN,
                'admin'
            )
        );
        $throttle->hit($this->request(), LoginThrottle::SCOPE_LOGIN, 'other');
        $this->assertTrue(
            $throttle->isBlocked(
                $this->request(),
                LoginThrottle::SCOPE_LOGIN,
                'other'
            ),
            'IP counter survives a reset'
        );
    }

    public function testWindowExpires(): void
    {
        $cache = new ArrayAdapter();
        $throttle = new LoginThrottle($cache, 1, 10, 1);
        $throttle->hit($this->request(), LoginThrottle::SCOPE_LOGIN, 'admin');
        $this->assertTrue($throttle->isBlocked($this->request(), LoginThrottle::SCOPE_LOGIN, 'admin'));

        sleep(2);

        $this->assertFalse($throttle->isBlocked($this->request(), LoginThrottle::SCOPE_LOGIN, 'admin'));
    }

    public function testWithoutIdentifierOnlyTheIpIsCounted(): void
    {
        $throttle = new LoginThrottle(new ArrayAdapter(), 1, 2);
        $throttle->hit($this->request(), LoginThrottle::SCOPE_RESET_PASSWORD);
        $this->assertFalse($throttle->isBlocked($this->request(), LoginThrottle::SCOPE_RESET_PASSWORD));
        $throttle->hit($this->request(), LoginThrottle::SCOPE_RESET_PASSWORD);

        $this->assertTrue($throttle->isBlocked($this->request(), LoginThrottle::SCOPE_RESET_PASSWORD));
    }
}
