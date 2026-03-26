<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use DateTimeImmutable;
use PhpList\RestApiClient\Endpoint\SubscribersClient;
use PhpList\RestApiClient\Entity\Subscriber;
use PhpList\RestApiClient\Request\Subscriber\ExportSubscriberRequest;
use PhpList\RestApiClient\Request\Subscriber\SubscribersFilterRequest;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/subscribers', name: 'subscriber_')]
class SubscribersController extends AbstractController
{
    public function __construct(private readonly SubscribersClient $subscribersClient)
    {
    }

    /**
     * @SuppressWarnings("CyclomaticComplexity")
     * @SuppressWarnings("NPathComplexity")
     */
    #[Route('/', name: 'list', methods: ['GET'])]
    public function index(Request $request): JsonResponse|Response
    {
        $accept = (string) $request->headers->get('Accept', '');
        $wantsJson = $request->isXmlHttpRequest() || str_contains($accept, 'application/json');
        if (! $wantsJson) {
            return $this->render('spa.html.twig', [
                'page' => 'Subscribers',
                'api_token' => $request->getSession()->get('auth_token'),
                'api_base_url' => $this->getParameter('api_base_url'),
            ]);
        }

        $afterId = $request->query->has('after_id') ? $request->query->getInt('after_id') : null;

        $filter = new SubscribersFilterRequest(
            isConfirmed: $request->query->has('confirmed') ? true :
                ($request->query->has('unconfirmed') ? false : null),
            isBlacklisted: $request->query->has('blacklisted') ? true :
                ($request->query->has('non-blacklisted') ? false : null),
            findColumn: $request->query->get('findColumn'),
            findValue: $request->query->get('findValue'),
        );

        $collection = $this->subscribersClient->getSubscribers($filter, $afterId, 10);

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
                'isFirstPage' => $afterId === null,
            ],
        ];

        return $this->json($initialData);
    }

    #[Route('/export', name: 'export', methods: ['GET'])]
    public function export(Request $request): Response
    {
        $columns = array_values(
            array_filter(
                $request->query->all('columns'),
                static fn (mixed $value): bool => is_string($value) && $value !== ''
            )
        );

        $defaultRequest = new ExportSubscriberRequest();

        $exportRequest = new ExportSubscriberRequest(
            dateType: (string) $request->query->get('date_type', 'any'),
            listId: $request->query->has('list_id') ? $request->query->getInt('list_id') : null,
            dateFrom: $request->query->get('date_from') ?: null,
            dateTo: $request->query->get('date_to') ?: null,
            columns: $columns === [] ? $defaultRequest->columns : $columns
        );

        $upstreamResponse = $this->subscribersClient->exportSubscribers($exportRequest);

        $content = (string) $upstreamResponse->getBody();

        $contentType = $upstreamResponse->getHeaderLine('Content-Type');
        if ($contentType === '') {
            $contentType = 'text/csv; charset=UTF-8';
        }

        $contentDisposition = $upstreamResponse->getHeaderLine('Content-Disposition');
        if ($contentDisposition === '') {
            $contentDisposition = sprintf(
                'attachment; filename="subscribers_export_%s.csv"',
                date('Y-m-d_H-i-s')
            );
        }

        $response = new Response($content);
        $response->headers->set('Content-Type', $contentType);
        $response->headers->set('Content-Disposition', $contentDisposition);

        return $response;
    }
}
