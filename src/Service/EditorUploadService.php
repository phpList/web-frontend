<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Service;

use Exception;
use PhpList\WebFrontend\Dto\EditorAssetItem;
use PhpList\WebFrontend\Dto\EditorUploadResult;
use PhpList\WebFrontend\Exception\UpstreamServiceException;
use PhpList\RestApiClient\Endpoint\UploadsClient as RestApiUploadsClient;
use PhpList\RestApiClient\Exception\AuthenticationException;
use PhpList\RestApiClient\Exception\AuthorizationException;
use PhpList\RestApiClient\Exception\NotFoundException;
use RuntimeException;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final class EditorUploadService
{
    private const UPLOAD_DIRECTORY = 'uploadimages';

    private const MAX_FILE_SIZE = 10 * 1024 * 1024;

    public function __construct(
        private readonly RestApiUploadsClient $uploadsClient,
    ) {
    }

    /**
     * @throws AuthorizationException
     * @throws AuthenticationException
     * @throws UpstreamServiceException on API/transport failure
     */
    public function storeImage(UploadedFile $uploadedFile): EditorUploadResult
    {
        $tempPath = $this->validateUploadedFile($uploadedFile);

        // The API validates the extension of the transmitted filename, and the REST
        // client derives that filename from the path's basename. The framework stores
        // uploads under an extensionless temp name (e.g. /tmp/phpAB12), so hand the
        // client a path whose basename carries the real extension.
        $uploadPath = $this->prepareUploadPath($uploadedFile, $tempPath);

        try {
            $response = $this->uploadsClient->upload($uploadPath, 'upload');
        } catch (AuthenticationException | AuthorizationException $e) {
            throw $e;
        } catch (Exception $e) {
            throw new UpstreamServiceException('Upload failed: ' . $e->getMessage(), 0, $e);
        } finally {
            if ($uploadPath !== $tempPath && is_file($uploadPath)) {
                unlink($uploadPath);
            }
        }

        $fileName = $response['fileName']
            ?? ($uploadedFile->getClientOriginalName() ?: basename($uploadPath));
        $relativeUrl = $response['url'] ?? $this->buildRelativeUrl($fileName);

        return new EditorUploadResult(
            fileName: $fileName,
            relativeUrl: $relativeUrl,
        );
    }

    /**
     * @throws AuthorizationException
     * @throws AuthenticationException
     * @throws UpstreamServiceException on API/transport failure
     * @return array<int, EditorAssetItem>
     */
    public function listAssets(): array
    {
        try {
            $response = $this->uploadsClient->getUploads(self::UPLOAD_DIRECTORY);
        } catch (AuthenticationException | AuthorizationException $e) {
            throw $e;
        } catch (NotFoundException) {
            // The upload directory is created lazily on first upload; treat a missing
            // directory as an empty asset list rather than an error.
            return [];
        } catch (Exception $e) {
            throw new UpstreamServiceException('Failed to list assets: ' . $e->getMessage(), 0, $e);
        }

        $files = $response['files'] ?? [];

        return $this->loadItems($files);
    }

    public function buildRelativeUrl(string $fileName): string
    {
        return '/' . self::UPLOAD_DIRECTORY . '/' . rawurlencode(basename($fileName));
    }

    public function getTargetDirectory(): string
    {
        return '/' . self::UPLOAD_DIRECTORY;
    }

    /**
     * Return a filesystem path whose basename carries the upload's real extension so
     * the API can validate it. Returns the original temp path when no extension can be
     * determined or the copy fails.
     */
    private function prepareUploadPath(UploadedFile $uploadedFile, string $tempPath): string
    {
        $extension = $uploadedFile->getClientOriginalExtension();
        if ($extension === '') {
            $extension = (string) $uploadedFile->guessExtension();
        }

        if ($extension === '' || pathinfo($tempPath, PATHINFO_EXTENSION) !== '') {
            return $tempPath;
        }

        $namedPath = $tempPath . '.' . strtolower($extension);
        if (!copy($tempPath, $namedPath)) {
            return $tempPath;
        }

        return $namedPath;
    }

    private function loadItems(array $files): array
    {
        $items = [];
        foreach ($files as $file) {
            $fileName = (string) ($file['name'] ?? '');
            if ($fileName === '') {
                continue;
            }

            if (($file['type'] ?? '') === 'directory') {
                continue;
            }

            $mimeType = (string) ($file['mime_type'] ?? $this->guessMimeType($fileName));

            $items[] = new EditorAssetItem(
                fileName: $fileName,
                url: (string) ($file['path'] ?? $this->buildRelativeUrl($fileName)),
                mimeType: $mimeType,
                size: (int) ($file['size'] ?? 0),
                modifiedAt: (int) ($file['modified'] ?? time()),
                isImage: str_starts_with($mimeType, 'image/'),
            );
        }

        // Newest first, so the most recently uploaded assets surface at the top of the picker.
        usort(
            $items,
            static fn (EditorAssetItem $as1, EditorAssetItem $as2): int => $as2->modifiedAt <=> $as1->modifiedAt
        );

        return $items;
    }

    private function guessMimeType(string $fileName): string
    {
        return match (strtolower(pathinfo($fileName, PATHINFO_EXTENSION))) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'bmp' => 'image/bmp',
            'svg' => 'image/svg+xml',
            default => 'application/octet-stream',
        };
    }

    private function validateUploadedFile(UploadedFile $uploadedFile): string
    {
        if (!$uploadedFile->isValid()) {
            throw new RuntimeException($uploadedFile->getErrorMessage());
        }

        if ($uploadedFile->getSize() > self::MAX_FILE_SIZE) {
            throw new RuntimeException(sprintf(
                'The uploaded file exceeds the maximum allowed size of %d MB.',
                intdiv(self::MAX_FILE_SIZE, 1024 * 1024)
            ));
        }

        $mimeType = (string) $uploadedFile->getMimeType();
        if (!str_starts_with($mimeType, 'image/')) {
            throw new RuntimeException('Only image uploads are supported.');
        }

        $tempPath = $uploadedFile->getRealPath();
        if (!is_string($tempPath) || $tempPath === '') {
            throw new RuntimeException('Failed to get uploaded file path.');
        }

        return $tempPath;
    }
}
