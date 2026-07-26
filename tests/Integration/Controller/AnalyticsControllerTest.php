<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Integration\Controller;

use PhpList\WebFrontend\Controller\AnalyticsController;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\HttpFoundation\Session\Storage\MockArraySessionStorage;
use Symfony\Component\Routing\RouterInterface;

class AnalyticsControllerTest extends KernelTestCase
{
    public function testAnalyticsRouteIsRegistered(): void
    {
        self::bootKernel();
        /** @var RouterInterface $router */
        $router = static::getContainer()->get('router');

        self::assertSame('/analytics/', $router->generate('analytics_list'));
    }

    public function testAnalyticsPageRendersExpectedSpaPayload(): void
    {
        self::bootKernel();
        /** @var AnalyticsController $controller */
        $controller = static::getContainer()->get(AnalyticsController::class);
        $apiBaseUrl = (string) static::getContainer()->getParameter('app.api_base_url');

        $request = Request::create('/analytics/');
        $session = new Session(new MockArraySessionStorage());
        $session->set('auth_token', 'integration-token');
        $request->setSession($session);

        $response = $controller->index($request);
        $content = (string) $response->getContent();

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('<title>phpList - Analytics</title>', $content);
        self::assertStringContainsString('data-api-token="integration-token"', $content);
        self::assertStringContainsString(sprintf('data-api-base-url="%s"', $apiBaseUrl), $content);
    }
}
