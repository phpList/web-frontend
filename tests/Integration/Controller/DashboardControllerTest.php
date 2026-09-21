<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Integration\Controller;

use PhpList\WebFrontend\Controller\DashboardController;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\HttpFoundation\Session\Storage\MockArraySessionStorage;
use Symfony\Component\Routing\RouterInterface;

class DashboardControllerTest extends KernelTestCase
{
    public function testDashboardRouteIsRegistered(): void
    {
        self::bootKernel();
        /** @var RouterInterface $router */
        $router = static::getContainer()->get('router');

        self::assertSame('/', $router->generate('home'));
    }

    public function testDashboardRendersSpaShellWithoutFetchingStats(): void
    {
        self::bootKernel();
        $apiBaseUrl = (string) static::getContainer()->getParameter('app.api_base_url');

        $controller = new DashboardController();
        $controller->setContainer(static::getContainer());

        $request = Request::create('/');
        $session = new Session(new MockArraySessionStorage());
        $session->set('auth_token', 'integration-token');
        $request->setSession($session);
        static::getContainer()->get(RequestStack::class)->push($request);

        $response = $controller->index();
        $content = (string) $response->getContent();

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('<title>phpList - Dashboard</title>', $content);
        self::assertStringContainsString('data-api-token="integration-token"', $content);
        self::assertStringContainsString(sprintf('data-api-base-url="%s"', $apiBaseUrl), $content);
        self::assertStringNotContainsString('data-dashboard-stats', $content);
        self::assertStringNotContainsString('data-dashboard-error', $content);
    }
}
