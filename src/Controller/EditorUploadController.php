<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use PhpList\WebFrontend\Exception\UpstreamServiceException;
use PhpList\WebFrontend\Service\EditorUploadService;
use RuntimeException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/editor', name: 'editor_')]
final class EditorUploadController
{
    public function __construct(
        private readonly EditorUploadService $editorUploadService,
    ) {
    }

    #[Route('/upload', name: 'upload', methods: ['POST'])]
    public function upload(Request $request): JsonResponse
    {
        $uploadedFile = $request->files->get('upload');

        if (!$uploadedFile) {
            return new JsonResponse([
                'error' => [
                    'message' => 'No file was provided.',
                ],
            ], Response::HTTP_BAD_REQUEST);
        }

        try {
            $result = $this->editorUploadService->storeImage($uploadedFile);
        } catch (UpstreamServiceException $exception) {
            return new JsonResponse([
                'error' => [
                    'message' => $exception->getMessage(),
                ],
            ], Response::HTTP_BAD_GATEWAY);
        }

        return new JsonResponse([
            'url' => $result->relativeUrl,
            'fileName' => $result->fileName,
        ]);
    }

    #[Route('/assets', name: 'assets', methods: ['GET'])]
    public function assets(): JsonResponse
    {
        try {
            $assets = $this->editorUploadService->listAssets();
        } catch (UpstreamServiceException $exception) {
            return new JsonResponse([
                'error' => [
                    'message' => $exception->getMessage(),
                ],
            ], Response::HTTP_BAD_GATEWAY);
        }

        return new JsonResponse([
            'items' => array_map(
                static fn ($asset) => $asset->toArray(),
                $assets
            ),
        ]);
    }
}
