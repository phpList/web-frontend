<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/campaigns', name: 'campaign_')]
class CampaignsController extends AbstractController
{
    #[Route('/', name: 'list', methods: ['GET'])]
    public function index(Request $request): Response
    {
        return $this->render('spa.html.twig', [
            'page' => 'Campaigns',
            'api_token' => $request->getSession()->get('auth_token'),
            'api_base_url' => $this->getParameter('api_base_url'),
        ]);
    }

    #[Route('/create', name: 'create', methods: ['GET'])]
    public function create(Request $request): Response
    {
        return $this->render('spa.html.twig', [
            'page' => 'Create Campaign',
            'api_token' => $request->getSession()->get('auth_token'),
            'api_base_url' => $this->getParameter('api_base_url'),
        ]);
    }

    #[Route('/{campaignId}/edit', name: 'edit', methods: ['GET'])]
    public function edit(Request $request, int $campaignId): Response
    {
        return $this->render('spa.html.twig', [
            'page' => sprintf('Edit Campaign #%d', $campaignId),
            'api_token' => $request->getSession()->get('auth_token'),
            'api_base_url' => $this->getParameter('api_base_url'),
        ]);
    }
}
