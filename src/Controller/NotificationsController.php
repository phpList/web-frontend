<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use PhpList\RestApiClient\Client;
use PhpList\RestApiClient\Exception\ApiException;
use PhpList\RestApiClient\Exception\AuthenticationException;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Proxies the REST API's admin notifications (phplist3's in-app Info/Warn/Error banners) to the SPA.
 */
class NotificationsController extends AbstractController
{
    public function __construct(
        private readonly Client $apiClient,
        private readonly LoggerInterface $logger,
    ) {
    }

    #[Route('/admin-notifications', name: 'admin_notifications', methods: ['GET'])]
    public function index(Request $request): JsonResponse
    {
        // Same race as /admin-about: concurrent XHRs share one PHP session, so re-set the token.
        $authToken = $request->getSession()->get('auth_token');
        if ($authToken) {
            $this->apiClient->setSessionId((string) $authToken);
        }

        try {
            $data = $this->apiClient->get('notifications');
        } catch (AuthenticationException) {
            return new JsonResponse(['error' => 'Unable to load notifications.'], Response::HTTP_UNAUTHORIZED);
        } catch (ApiException $e) {
            $this->logger->error('Unable to load notifications: ' . $e->getMessage());

            return new JsonResponse(['error' => 'Unable to load notifications.'], Response::HTTP_BAD_GATEWAY);
        }

        return new JsonResponse(['items' => is_array($data['items'] ?? null) ? $data['items'] : []]);
    }
}
