<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/templates', name: 'template_')]
class TemplatesController extends AbstractController
{
    #[Route('/', name: 'templates', methods: ['GET'])]
    public function index(Request $request): Response
    {
        return $this->render('@PhpListFrontend/spa.html.twig', [
            'page' => 'Templates',
        ]);
    }

    #[Route('/create', name: 'create', methods: ['GET'])]
    public function create(Request $request): Response
    {
        return $this->render('@PhpListFrontend/spa.html.twig', [
            'page' => 'Create Template',
        ]);
    }

    #[Route('/{templateId}/edit', name: 'edit', methods: ['GET'])]
    public function edit(Request $request, int $templateId): Response
    {
        return $this->render('@PhpListFrontend/spa.html.twig', [
            'page' => sprintf('Edit Template #%d', $templateId),
        ]);
    }
}
