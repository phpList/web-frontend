<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use PhpList\RestApiClient\Endpoint\ListClient;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/lists', name: 'list_')]
class ListsController extends AbstractController
{
    public function __construct(private readonly ListClient $listClient)
    {
    }

    #[Route('/', name: 'list', methods: ['GET'])]
    public function index(Request $request): JsonResponse|Response
    {
        $accept = (string) $request->headers->get('Accept', '');
        $wantsJson = $request->isXmlHttpRequest() || str_contains($accept, 'application/json');
        if (! $wantsJson) {
            return $this->render('spa.html.twig', [
                'page' => 'Lists',
                'api_token' => $request->getSession()->get('auth_token'),
                'api_base_url' => $this->getParameter('api_base_url'),
            ]);
        }
        $initialData = $this->listClient->getLists();

        return $this->json($initialData);
    }

    #[Route('/{listId}/subscribers', name: 'list_subscribers', methods: ['GET'])]
    public function view(Request $request, int $listId): JsonResponse|Response
    {
        return $this->render('spa.html.twig', [
            'page' => 'List Subscribers',
            'api_token' => $request->getSession()->get('auth_token'),
            'api_base_url' => $this->getParameter('api_base_url'),
        ]);
    }
}
