<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Service;

use PhpList\WebFrontend\Dto\EditorAssetItem;
use PhpList\WebFrontend\Dto\EditorUploadResult;
use PhpList\RestApiClient\Endpoint\UploadsClient as RestApiUploadsClient;
use RuntimeException;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final class EditorUploadService
{
    private const UPLOAD_DIRECTORY = 'uploadimages';

    public function __construct(
        private readonly RestApiUploadsClient $uploadsClient,
    ) {
    }

    public function storeImage(UploadedFile $uploadedFile): EditorUploadResult
    {
        if (!$uploadedFile->isValid()) {
            throw new RuntimeException($uploadedFile->getErrorMessage());
        }

        $mimeType = (string) $uploadedFile->getMimeType();
        if (!str_starts_with($mimeType, 'image/')) {
            throw new RuntimeException('Only image uploads are supported.');
        }

        $tempPath = $uploadedFile->getRealPath();
        if (!is_string($tempPath)) {
            throw new RuntimeException('Failed to get uploaded file path.');
        }

        try {
            $response = $this->uploadsClient->upload($tempPath, 'upload');
        } catch (\Exception $e) {
            throw new RuntimeException('Upload failed: ' . $e->getMessage(), 0, $e);
        }

        $fileName = $response['fileName'] ?? basename($tempPath);
        $relativeUrl = $response['url'] ?? '/' . self::UPLOAD_DIRECTORY . '/' . $fileName;

        return new EditorUploadResult(
            fileName: $fileName,
            relativeUrl: $relativeUrl,
        );
    }

    /**
     * @return array<int, EditorAssetItem>
     */
    public function listAssets(): array
    {
        try {
            $response = $this->uploadsClient->getUploads(self::UPLOAD_DIRECTORY);
        } catch (\Exception $e) {
            throw new RuntimeException('Failed to list assets: ' . $e->getMessage(), 0, $e);
        }

        $items = [];
        $files = $response['files'] ?? [];

        foreach ($files as $file) {
            $items[] = new EditorAssetItem(
                fileName: $file['fileName'] ?? $file['name'] ?? '',
                url: $file['url'] ?? '',
                mimeType: $file['mimeType'] ?? $file['mime_type'] ?? 'application/octet-stream',
                size: (int) ($file['size'] ?? 0),
                modifiedAt: (int) ($file['modifiedAt'] ?? $file['modified_at'] ?? time()),
                isImage: str_starts_with($file['mimeType'] ?? $file['mime_type'] ?? '', 'image/'),
            );
        }

        usort(
            $items,
            static fn (EditorAssetItem $left, EditorAssetItem $right): int => $right->modifiedAt <=> $left->modifiedAt
        );

        return $items;
    }

    public function buildRelativeUrl(string $fileName): string
    {
        return '/' . self::UPLOAD_DIRECTORY . '/' . ltrim($fileName, '/');
    }

    public function getTargetDirectory(): string
    {
        return '/' . self::UPLOAD_DIRECTORY;
    }
}
