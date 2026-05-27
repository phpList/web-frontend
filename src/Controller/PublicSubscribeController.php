<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use PhpList\Core\Core\ApplicationStructure;
use PhpList\RestApiClient\Endpoint\AuthClient;
use PhpList\RestApiClient\Endpoint\ListClient;
use PhpList\RestApiClient\Endpoint\SubscribePagesClient;
use PhpList\RestApiClient\Exception\AuthenticationException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class PublicSubscribeController extends AbstractController
{
    public function __construct(
        private readonly SubscribePagesClient $subscribePagesClient,
        private readonly ListClient $listClient,
        private readonly AuthClient $authClient,
    ) {
    }

    #[Route('/subscribe/{pageId}', name: 'public_subscribe', requirements: ['pageId' => '\d+'], methods: ['GET'])]
    public function show(Request $request, int $pageId): Response
    {
        try {
            $admin = $this->authClient->getSessionUser();
        } catch (AuthenticationException $e) {
            $admin = null;
        }
        $page = $this->subscribePagesClient->getSubscribePage($pageId);

        $data = array_column($page->data, 'value', 'key');

        $lists = [];
        $listIds = array_filter(explode(',', $data['lists'] ?? ''));
        foreach ($listIds as $listId) {
            $lists[] = $this->listClient->getPublicList((int)$listId);
        }

        $languageFile = $data['language_file'] ?? 'english.inc';
        $languageTexts = $this->loadLanguageTexts(is_string($languageFile) ? $languageFile : null);

        return $this->render('@PhpListFrontend/public/subscribe.html.twig', [
            'page_id' => $pageId,
            'api_token' => $request->getSession()->get('auth_token'),
            'data' => $data,
            'language_texts' => $languageTexts,
            'lists' => $lists,
            'admin' => $admin,
            'admin_page_url' => $this->generateUrl('public_edit', ['pageId' => $pageId]),
        ]);
    }

    /**
     * @return array<string, string>
     */
    private function loadLanguageTexts(?string $languageFile): array
    {
        $applicationRoot = (new ApplicationStructure())->getApplicationRoot();
        $languageDir = $applicationRoot . '/public/lists/texts';

        if (!is_dir($languageDir)) {
            return [];
        }

        $selectedFile = $this->sanitizeLanguageFile($languageFile) ?? 'english.inc';
        $languagePath = $languageDir . '/' . $selectedFile;

        if (!is_file($languagePath)) {
            $languagePath = $languageDir . '/english.inc';
        }

        if (!is_file($languagePath)) {
            return [];
        }

        $loader = static function (string $path): array {
            require $path;

            return array_map(function ($value) {
                return $value;
            }, get_defined_vars());
        };

        return $loader($languagePath);
    }

    private function sanitizeLanguageFile(?string $languageFile): ?string
    {
        if (!is_string($languageFile) || $languageFile === '') {
            return null;
        }

        $languageFile = basename($languageFile);

        if (!preg_match('/^[A-Za-z0-9._-]+\.inc$/', $languageFile)) {
            return null;
        }

        return $languageFile;
    }
}
