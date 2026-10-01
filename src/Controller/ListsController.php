<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use PhpList\RestApiClient\Endpoint\ListClient;
use PhpList\WebFrontend\Trait\WantsJsonTrait;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/lists', name: 'list_')]
class ListsController extends AbstractController
{
    use WantsJsonTrait;

    public function __construct(private readonly ListClient $listClient)
    {
    }

    #[Route('/', name: 'list', methods: ['GET'])]
    public function index(Request $request): JsonResponse|Response
    {
        if (! $this->wantsJson($request)) {
            return $this->render('@PhpListFrontend/spa.html.twig', [
                'page' => 'Lists',
            ]);
        }
        $initialData = $this->listClient->getLists();

        return $this->json($initialData);
    }

    #[Route('/{listId}/subscribers', name: 'list_subscribers', methods: ['GET'])]
    public function view(Request $request, int $listId): JsonResponse|Response
    {
        return $this->render('@PhpListFrontend/spa.html.twig', [
            'page' => 'List Subscribers',
        ]);
    }
}
