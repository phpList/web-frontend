<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/public', name: 'public_')]
class PublicPagesController extends AbstractController
{
    #[Route('/', name: 'pages', methods: ['GET'])]
    #[Route('', name: 'pages_no_slash', methods: ['GET'])]
    public function index(Request $request): Response
    {
        return $this->render('@PhpListFrontend/spa.html.twig', [
            'page' => 'Subscribe Pages',
            'api_token' => $request->getSession()->get('auth_token'),
            'api_base_url' => $this->getParameter('api_base_url'),
        ]);
    }

    #[Route('/create', name: 'create', methods: ['GET'])]
    #[Route('/create/', name: 'create_with_slash', methods: ['GET'])]
    public function create(Request $request): Response
    {
        return $this->render('@PhpListFrontend/spa.html.twig', [
            'page' => 'Create Subscribe Page',
            'api_token' => $request->getSession()->get('auth_token'),
            'api_base_url' => $this->getParameter('api_base_url'),
        ]);
    }

    #[Route('/{pageId}/edit', name: 'edit', methods: ['GET'])]
    #[Route('/{pageId}/edit/', name: 'edit_with_slash', methods: ['GET'])]
    public function edit(Request $request, int $pageId): Response
    {
        return $this->render('@PhpListFrontend/spa.html.twig', [
            'page' => sprintf('Edit Subscribe Page #%d', $pageId),
            'api_token' => $request->getSession()->get('auth_token'),
            'api_base_url' => $this->getParameter('api_base_url'),
        ]);
    }
}
