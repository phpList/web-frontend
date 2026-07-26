<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/settings', name: 'setting_')]
class SettingsController extends AbstractController
{
    #[Route('/', name: 'settings', methods: ['GET'])]
    public function index(Request $request): Response
    {
        return $this->render('@PhpListFrontend/spa.html.twig', [
            'page' => 'Settings',
            'api_token' => $request->getSession()->get('auth_token'),
            'api_base_url' => $this->getParameter('app.api_base_url'),
        ]);
    }
}
