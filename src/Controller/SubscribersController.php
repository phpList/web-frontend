<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use PhpList\RestApiClient\Endpoint\SubscribersClient;
use PhpList\RestApiClient\Entity\Subscriber;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class SubscribersController extends AbstractController
{
    public function __construct(private readonly SubscribersClient $subscribersClient)
    {
    }

    #[Route('/subscribers', name: 'subscribers', methods: ['GET'])]
    public function index(Request $request): Response
    {
        $afterId = (int) $request->query->get('after_id');
        $limit = max(1, (int) $request->query->get('limit', 25));

        /** @var $collection*/
        $collection = $this->subscribersClient->getSubscribers($afterId, $limit);

        $initialData = [
            'items' => array_map(static function (Subscriber $subscriber) {
                return [
                    'id' => $subscriber->id,
                    'email' => $subscriber->email,
                    'confirmed' => $subscriber->confirmed,
                    'blacklisted' => $subscriber->blacklisted,
                    'uniqueId' => $subscriber->uniqueId,
                ];
            }, $collection->items ?? []),
            'pagination' => [
                'limit' => $collection->pagination->limit,
                'afterId' => $collection->pagination->nextCursor,
                'hasMore' => $collection->pagination->hasMore ,
                'total' => $collection->pagination->total,
            ],
        ];

        return $this->render('subscribers/index.html.twig', [
            'initial_subscribers' => $initialData,
        ]);
    }
}
