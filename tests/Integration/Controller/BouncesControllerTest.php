<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Integration\Controller;

use PhpList\WebFrontend\Controller\BouncesController;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\HttpFoundation\Session\Storage\MockArraySessionStorage;
use Symfony\Component\Routing\RouterInterface;

class BouncesControllerTest extends KernelTestCase
{
    public function testBouncesRouteIsRegistered(): void
    {
        self::bootKernel();
        /** @var RouterInterface $router */
        $router = static::getContainer()->get('router');

        self::assertSame('/bounces/', $router->generate('bounce_list'));
    }

    public function testBouncesPageRendersExpectedSpaPayload(): void
    {
        self::bootKernel();
        /** @var BouncesController $controller */
        $controller = static::getContainer()->get(BouncesController::class);
        $apiBaseUrl = (string) static::getContainer()->getParameter('api_base_url');

        $request = Request::create('/bounces/');
        $session = new Session(new MockArraySessionStorage());
        $session->set('auth_token', 'integration-token');
        $request->setSession($session);

        $response = $controller->index($request);
        $content = (string) $response->getContent();

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('<title>phpList - Bounces</title>', $content);
        self::assertStringContainsString('data-api-token="integration-token"', $content);
        self::assertStringContainsString(sprintf('data-api-base-url="%s"', $apiBaseUrl), $content);
    }
}
