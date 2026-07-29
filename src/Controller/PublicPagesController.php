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
    public function index(Request $request): Response
    {
        return $this->render('@PhpListFrontend/spa.html.twig', [
            'page' => 'Subscribe Pages',
        ]);
    }

    #[Route('/create', name: 'create', methods: ['GET'])]
    public function create(Request $request): Response
    {
        return $this->render('@PhpListFrontend/spa.html.twig', [
            'page' => 'Create Subscribe Page',
        ]);
    }

    #[Route('/{pageId}/edit', name: 'edit', methods: ['GET'])]
    public function edit(Request $request, int $pageId): Response
    {
        return $this->render('@PhpListFrontend/spa.html.twig', [
            'page' => sprintf('Edit Subscribe Page #%d', $pageId),
        ]);
    }
}
