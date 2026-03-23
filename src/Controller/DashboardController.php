<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use PhpList\RestApiClient\Endpoint\StatisticsClient;
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
        $stats = $this->statisticsClient->getDashboardStats();
        $recentCampaigns = [];
        foreach ($stats->recentCampaigns as $campaign) {
            $recentCampaigns[] = [
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
        foreach ($stats->campaignPerformance as $point) {
            $chartLabels[] = $point->date?->format('M d') ?? '';
            $chartOpens[] = $point->opens;
            $chartClicks[] = $point->clicks;
        }

        return $this->render('spa.html.twig', [
            'page' => 'Dashboard',
            'api_token' => $request->getSession()->get('auth_token'),
            'api_base_url' => $this->getParameter('api_base_url'),
            'dashboard_stats' => [
                'total_subscribers' => [
                    'value' => $stats->totalSubscribers->value,
                    'change_vs_last_month' => $stats->totalSubscribers->changeVsLastMonth,
                ],
                'active_campaigns' => [
                    'value' => $stats->activeCampaigns->value,
                    'change_vs_last_month' => $stats->activeCampaigns->changeVsLastMonth,
                ],
                'open_rate' => [
                    'value' => $stats->openRate->value,
                    'change_vs_last_month' => $stats->openRate->changeVsLastMonth,
                ],
                'bounce_rate' => [
                    'value' => $stats->bounceRate->value,
                    'change_vs_last_month' => $stats->bounceRate->changeVsLastMonth,
                ],
                'recent_campaigns' => $recentCampaigns,
                'chart' => [
                    'labels' => $chartLabels,
                    'series' => [
                        ['name' => 'Opens', 'data' => $chartOpens],
                        ['name' => 'Clicks', 'data' => $chartClicks],
                    ],
                ],
            ],
        ]);
    }
}
