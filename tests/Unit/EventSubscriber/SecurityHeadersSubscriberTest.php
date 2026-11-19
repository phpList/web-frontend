<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\EventSubscriber;

use PhpList\WebFrontend\EventSubscriber\SecurityHeadersSubscriber;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\HttpKernel\KernelEvents;

class SecurityHeadersSubscriberTest extends TestCase
{
    public function testSubscribesToKernelResponse(): void
    {
        $this->assertArrayHasKey(KernelEvents::RESPONSE, SecurityHeadersSubscriber::getSubscribedEvents());
    }

    public function testAdminPagesGetFullHardeningHeaders(): void
    {
        $response = $this->handle(Request::create('/campaigns'));

        $this->assertSame('nosniff', $response->headers->get('X-Content-Type-Options'));
        $this->assertSame('same-origin', $response->headers->get('Referrer-Policy'));
        $this->assertSame('SAMEORIGIN', $response->headers->get('X-Frame-Options'));
        $csp = (string) $response->headers->get('Content-Security-Policy');
        $this->assertStringContainsString("frame-ancestors 'self'", $csp);
        $this->assertStringContainsString("object-src 'none'", $csp);
        $this->assertStringContainsString("base-uri 'self'", $csp);
        $this->assertStringContainsString("form-action 'self'", $csp);
        $this->assertFalse($response->headers->has('Strict-Transport-Security'));
    }

    /**
     * @dataProvider publicPaths
     */
    public function testPublicPagesStayEmbeddable(string $path): void
    {
        $response = $this->handle(Request::create($path));

        $this->assertFalse($response->headers->has('X-Frame-Options'));
        $this->assertStringNotContainsString(
            'frame-ancestors',
            (string) $response->headers->get('Content-Security-Policy')
        );
        $this->assertSame('nosniff', $response->headers->get('X-Content-Type-Options'));
    }

    /**
     * @return array<string, array{string}>
     */
    public static function publicPaths(): array
    {
        return [
            'subscribe' => ['/subscribe/3'],
            'unsubscribe' => ['/unsubscribe/3'],
            'front controller' => ['/app.php/subscribe/3'],
        ];
    }

    public function testLookalikePathsAreNotExempt(): void
    {
        $response = $this->handle(Request::create('/subscribers'));

        $this->assertSame('SAMEORIGIN', $response->headers->get('X-Frame-Options'));
    }

    public function testHstsOnlyOverHttps(): void
    {
        $response = $this->handle(Request::create('https://example.com/campaigns'));

        $this->assertStringContainsString('max-age=', (string) $response->headers->get('Strict-Transport-Security'));
    }

    public function testExistingContentSecurityPolicyIsKept(): void
    {
        $response = $this->handle(Request::create('/campaigns'), new Response('', 200, [
            'Content-Security-Policy' => "default-src 'none'",
        ]));

        $this->assertSame("default-src 'none'", $response->headers->get('Content-Security-Policy'));
    }

    public function testSubRequestsAreIgnored(): void
    {
        $response = $this->handle(Request::create('/campaigns'), null, HttpKernelInterface::SUB_REQUEST);

        $this->assertFalse($response->headers->has('X-Content-Type-Options'));
    }

    private function handle(
        Request $request,
        ?Response $response = null,
        int $type = HttpKernelInterface::MAIN_REQUEST,
    ): Response {
        $response ??= new Response();
        $event = new ResponseEvent($this->createMock(HttpKernelInterface::class), $request, $type, $response);
        (new SecurityHeadersSubscriber())->onKernelResponse($event);

        return $event->getResponse();
    }
}
