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
        $afterId = $request->query->get('after_id') !== null ? (int) $request->query->get('after_id') : null;
        $limit = max(1, (int) $request->query->get('limit', 10));

        $collection = $this->subscribersClient->getSubscribers($afterId, $limit);

        $history = $request->getSession()->get('subscribers_history', []);
        if ($afterId === null) {
            $history = [];
        }
        if ($afterId !== null && !in_array($afterId, $history, true)) {
            $history[] = $afterId;
            $request->getSession()->set('subscribers_history', $history);
        }

        $prevId = null;
        if ($afterId !== null) {
            $index = array_search($afterId, $history, true);
            if ($index === 0) {
                $prevId = 0;
            } elseif ($index > 0) {
                $prevId = $history[$index - 1];
            }
        }

        $initialData = [
            'items' => array_map(static function (Subscriber $subscriber) {
                return [
                    'id' => $subscriber->id,
                    'email' => $subscriber->email,
                    'confirmed' => $subscriber->confirmed,
                    'blacklisted' => $subscriber->blacklisted,
                    'createdAt' => $subscriber->createdAt,
                    'uniqueId' => $subscriber->uniqueId,
                    'listCount' => count($subscriber->subscribedLists),
                ];
            }, $collection->items ?? []),
            'pagination' => [
                'limit' => $collection->pagination->limit,
                'afterId' => $collection->pagination->nextCursor,
                'hasMore' => $collection->pagination->hasMore ,
                'total' => $collection->pagination->total,
                'prevId' => $prevId,
                'isFirstPage' => $afterId === null || $afterId === 0,
            ],
        ];

        if ($request->isXmlHttpRequest() || $request->headers->get('Accept') === 'application/json') {
            return $this->json($initialData);
        }

        return $this->render('subscribers/index.html.twig', [
            'subscribers' => $initialData['items'],
            'pagination' => $initialData['pagination'],
        ]);
    }
}
