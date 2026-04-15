<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Integration\Controller;

use PhpList\RestApiClient\Endpoint\StatisticsClient;
use PhpList\RestApiClient\Response\Statistics\DashboardStatisticsResponse;
use PhpList\WebFrontend\Controller\DashboardController;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\HttpFoundation\Request;
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

    public function testDashboardRendersSpaPayloadWithStats(): void
    {
        self::bootKernel();

        $statsClient = $this->createMock(StatisticsClient::class);
        $statsClient->expects(self::once())
            ->method('getDashboardStats')
            ->willReturn($this->createDashboardStatsResponse());

        $controller = new DashboardController($statsClient);
        $controller->setContainer(static::getContainer());

        $request = Request::create('/');
        $session = new Session(new MockArraySessionStorage());
        $session->set('auth_token', 'integration-token');
        $request->setSession($session);

        $response = $controller->index($request);
        $content = (string) $response->getContent();

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('<title>phpList - Dashboard</title>', $content);
        self::assertStringContainsString('data-api-token="integration-token"', $content);
        self::assertStringContainsString('data-api-base-url="http://api.phplist.local/"', $content);
        self::assertStringContainsString('data-dashboard-stats=', $content);
        self::assertStringContainsString('&quot;recent_campaigns&quot;', $content);
        self::assertStringContainsString('Weekly&#x20;Digest', $content);
    }

    private function createDashboardStatsResponse(): DashboardStatisticsResponse
    {
        return new DashboardStatisticsResponse([
            'summary_statistics' => [
                'total_subscribers' => [
                    'value' => 1000,
                    'change_vs_last_month' => 8.2,
                ],
                'active_campaigns' => [
                    'value' => 3,
                    'change_vs_last_month' => 1.0,
                ],
                'open_rate' => [
                    'value' => 47.6,
                    'change_vs_last_month' => 2.1,
                ],
                'bounce_rate' => [
                    'value' => 1.2,
                    'change_vs_last_month' => -0.2,
                ],
            ],
            'recent_campaigns' => [
                [
                    'name' => 'Weekly Digest',
                    'status' => 'sent',
                    'date' => '2026-04-10',
                    'open_rate' => 53.2,
                    'click_rate' => 12.3,
                ],
            ],
            'campaign_performance' => [
                [
                    'date' => '2026-04-09',
                    'opens' => 120,
                    'clicks' => 24,
                ],
            ],
        ]);
    }
}
