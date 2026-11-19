<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use PhpList\WebFrontend\Service\CommunityNewsService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class DashboardController extends AbstractController
{
    public function __construct(private readonly CommunityNewsService $communityNewsService)
    {
    }

    #[Route('/', name: 'home', methods: ['GET'])]
    public function index(): Response
    {
        return $this->render('@PhpListFrontend/spa.html.twig', [
            'page' => 'Dashboard',
        ]);
    }

    #[Route('/dashboard/community-news', name: 'dashboard_community_news', methods: ['GET'])]
    public function communityNews(): JsonResponse
    {
        return $this->json(['items' => $this->communityNewsService->getLatest(3)]);
    }
}
