<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use PhpList\RestApiClient\Exception\AuthorizationException;
use PhpList\RestApiClient\Endpoint\StatisticsClient;
use PhpList\RestApiClient\Response\Statistics\CampaignPerformanceCollection;
use PhpList\RestApiClient\Response\Statistics\DashboardSummaryResponse;
use PhpList\RestApiClient\Response\Statistics\RecentCampaignsCollection;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class DashboardController extends AbstractController
{
    public function __construct(private readonly StatisticsClient $statisticsClient)
    {
    }

    #[Route('/', name: 'home', methods: ['GET'])]
    public function index(Request $request): Response
    {
        $dashboardStats = [];
        $dashboardError = null;

        try {
            $summary = $this->statisticsClient->getDashboardSummary();
            $recentCampaigns = $this->statisticsClient->getRecentCampaigns();
            $campaignPerformance = $this->statisticsClient->getCampaignPerformance();
            $dashboardStats = $this->buildDashboardStats($summary, $recentCampaigns, $campaignPerformance);
        } catch (AuthorizationException $e) {
            $dashboardError = $e->getMessage() ?: 'Unable to load dashboard statistics.';
        }

        return $this->render('@PhpListFrontend/spa.html.twig', [
            'page' => 'Dashboard',
            'dashboard_stats' => $dashboardStats,
            'dashboard_error' => $dashboardError,
        ]);
    }

    private function buildDashboardStats(
        DashboardSummaryResponse $summary,
        RecentCampaignsCollection $recentCampaigns,
        CampaignPerformanceCollection $campaignPerformance
    ): array {
        $recentCampaignRows = [];
        foreach ($recentCampaigns->campaigns as $campaign) {
            $recentCampaignRows[] = [
                'name' => $campaign->name,
                'status' => $campaign->status,
                'date' => $campaign->date?->format('Y-m-d') ?? '',
                'openRate' => $campaign->openRate,
                'clickRate' => $campaign->clickRate,
            ];
        }

        $chartLabels = [];
        $chartOpens = [];
        $chartClicks = [];
        foreach ($campaignPerformance->points as $point) {
            $chartLabels[] = $point->date?->format('M d') ?? '';
            $chartOpens[] = $point->opens;
            $chartClicks[] = $point->clicks;
        }

        return [
            'total_subscribers' => [
                'value' => $summary->totalSubscribers->value,
                'change_vs_last_month' => $summary->totalSubscribers->changeVsLastMonth,
            ],
            'active_campaigns' => [
                'value' => $summary->activeCampaigns->value,
                'change_vs_last_month' => $summary->activeCampaigns->changeVsLastMonth,
            ],
            'open_rate' => [
                'value' => $summary->openRate->value,
                'change_vs_last_month' => $summary->openRate->changeVsLastMonth,
            ],
            'bounce_rate' => [
                'value' => $summary->bounceRate->value,
                'change_vs_last_month' => $summary->bounceRate->changeVsLastMonth,
            ],
            'recent_campaigns' => $recentCampaignRows,
            'chart' => [
                'labels' => $chartLabels,
                'series' => [
                    ['name' => 'Opens', 'data' => $chartOpens],
                    ['name' => 'Clicks', 'data' => $chartClicks],
                ],
            ],
        ];
    }
}
