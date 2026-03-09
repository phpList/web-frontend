<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use PhpList\RestApiClient\Endpoint\AuthClient;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class DashboardController extends AbstractController
{
    public function __construct(AuthClient $apiClient)
    {
        $this->apiClient = $apiClient;
    }

    #[Route('/', name: 'home', methods: ['GET'])]
    public function index(Request $request): Response
    {
        return $this->render('dashboard/index.html.twig');
    }
}
