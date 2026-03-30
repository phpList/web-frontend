<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use PhpList\RestApiClient\Endpoint\SubscribersClient;
use PhpList\RestApiClient\Request\Subscriber\SubscribersFilterRequest;
use PhpList\WebFrontend\Service\SubscriberCollectionNormalizer;
use PhpList\WebFrontend\Service\SubscriberExportRequestFactory;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/subscribers', name: 'subscriber_')]
class SubscribersController extends AbstractController
{
    public function __construct(
        private readonly SubscribersClient $subscribersClient,
        private readonly SubscriberCollectionNormalizer $subscriberCollectionNormalizer,
        private readonly SubscriberExportRequestFactory $subscriberExportRequestFactory
    ) {
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

        return $this->json($this->subscriberCollectionNormalizer->normalize($collection, $prevId, $afterId));
    }

    /**
     * @SuppressWarnings("CyclomaticComplexity")
     */
    #[Route('/export', name: 'export', methods: ['GET'])]
    public function export(Request $request): Response
    {
        $exportRequest = $this->subscriberExportRequestFactory->fromQuery($request->query);

        $upstreamResponse = $this->subscribersClient->exportSubscribers($exportRequest);
        $statusCode = $upstreamResponse->getStatusCode();
        $isSuccessfulExport = $statusCode >= 200 && $statusCode < 300;

        $contentType = $upstreamResponse->getHeaderLine('Content-Type');
        if ($isSuccessfulExport && $contentType === '') {
            $contentType = 'text/csv; charset=UTF-8';
        }

        $contentDisposition = $upstreamResponse->getHeaderLine('Content-Disposition');
        if ($isSuccessfulExport && $contentDisposition === '') {
            $contentDisposition = sprintf(
                'attachment; filename="subscribers_export_%s.csv"',
                date('Y-m-d_H-i-s')
            );
        }

        $body = $upstreamResponse->getBody();
        $response = new StreamedResponse(
            static function () use ($body): void {
                if ($body->isSeekable()) {
                    $body->rewind();
                }
                while (! $body->eof()) {
                    echo $body->read(8192);
                }
            },
            $statusCode
        );
        if ($contentType !== '') {
            $response->headers->set('Content-Type', $contentType);
        }

        if ($contentDisposition !== '') {
            $response->headers->set('Content-Disposition', $contentDisposition);
        }

        return $response;
    }
}
