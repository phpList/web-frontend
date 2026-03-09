<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use DateTimeImmutable;
use PhpList\RestApiClient\Endpoint\SubscribersClient;
use PhpList\RestApiClient\Entity\Subscriber;
use PhpList\RestApiClient\Request\Subscriber\SubscribersFilterRequest;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class SubscribersController extends AbstractController
{
    public function __construct(private readonly SubscribersClient $subscribersClient)
    {
    }

    /**
     * @SuppressWarnings("CyclomaticComplexity")
     * @SuppressWarnings("NPathComplexity")
     */
    #[Route('/subscribers', name: 'subscribers', methods: ['GET'])]
    public function index(Request $request): JsonResponse|Response
    {
        if (! $request->isXmlHttpRequest() && $request->headers->get('Accept') !== 'application/json') {
            return $this->render('spa.html.twig', ['page' => 'Subscribers']);
        }

        $afterId = (int) $request->query->get('after_id');
        $limit = max(1, (int) $request->query->get('limit', 10));

        $filter = new SubscribersFilterRequest(
            isConfirmed: $request->query->has('confirmed') ? true :
                ($request->query->has('unconfirmed') ? false : null),
            isBlacklisted: $request->query->has('blacklisted') ? true :
                ($request->query->has('non-blacklisted') ? false : null),
            sortBy: $request->query->get('sortBy'),
            sortDirection: $request->query->get('sortDirection'),
            findColumn: $request->query->get('findColumn'),
            findValue: $request->query->get('findValue'),
        );

        $collection = $this->subscribersClient->getSubscribers($filter, $afterId, $limit);

        $history = $request->getSession()->get('subscribers_history', []);
        if (!in_array($afterId, $history, true)) {
            $history[] = $afterId;
            $request->getSession()->set('subscribers_history', $history);
        }

        $prevId = null;
        $index = array_search($afterId, $history, true);
        if ($index === 0) {
            $prevId = 0;
        } elseif ($index > 0) {
            $prevId = $history[$index - 1];
        }

        $initialData = [
            'items' => array_map(static function (Subscriber $subscriber) {
                return [
                    'id' => $subscriber->id,
                    'email' => $subscriber->email,
                    'confirmed' => $subscriber->confirmed,
                    'blacklisted' => $subscriber->blacklisted,
                    'createdAt' => (new DateTimeImmutable($subscriber->createdAt))->format('Y-m-d H:i:s'),
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
                'isFirstPage' => $afterId === 0,
            ],
        ];

        return $this->json($initialData);
    }
}
