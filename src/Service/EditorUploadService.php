<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Service;

use PhpList\WebFrontend\Dto\EditorAssetItem;
use PhpList\WebFrontend\Dto\EditorUploadResult;
use FilesystemIterator;
use RuntimeException;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\String\Slugger\AsciiSlugger;

final class EditorUploadService
{
    private const STORAGE_SUBDIRECTORY = 'ckeditor5';

    public function __construct(
        private readonly string $projectDir,
        private readonly string $editorImagesDir,
        private readonly Filesystem $filesystem = new Filesystem(),
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

        $targetDirectory = $this->getTargetDirectory();
        $this->filesystem->mkdir($targetDirectory, 0755);

        $fileName = $this->buildFileName($uploadedFile);
        $uploadedFile->move($targetDirectory, $fileName);

        return new EditorUploadResult(
            fileName: $fileName,
            relativeUrl: $this->buildRelativeUrl($fileName),
        );
    }

    /**
     * @return array<int, EditorAssetItem>
     */
    public function listAssets(): array
    {
        $directory = $this->getTargetDirectory();

        if (!is_dir($directory)) {
            return [];
        }

        $items = [];
        foreach (new FilesystemIterator($directory, FilesystemIterator::SKIP_DOTS) as $fileInfo) {
            if (!$fileInfo->isFile()) {
                continue;
            }

            $fileName = $fileInfo->getBasename();
            if ($fileName === '' || str_starts_with($fileName, '.')) {
                continue;
            }

            $mimeType = (string) (mime_content_type($fileInfo->getPathname()) ?: 'application/octet-stream');

            $items[] = new EditorAssetItem(
                fileName: $fileName,
                url: $this->buildRelativeUrl($fileName),
                mimeType: $mimeType,
                size: (int) $fileInfo->getSize(),
                modifiedAt: (int) $fileInfo->getMTime(),
                isImage: str_starts_with($mimeType, 'image/'),
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
        return sprintf(
            '/%s/%s/%s',
            trim($this->editorImagesDir, '/'),
            self::STORAGE_SUBDIRECTORY,
            ltrim($fileName, '/')
        );
    }

    public function getTargetDirectory(): string
    {
        return rtrim($this->projectDir, '/')
            . '/public/'
            . trim($this->editorImagesDir, '/')
            . '/'
            . self::STORAGE_SUBDIRECTORY;
    }

    private function buildFileName(UploadedFile $uploadedFile): string
    {
        $originalName = pathinfo((string) $uploadedFile->getClientOriginalName(), PATHINFO_FILENAME);
        $safeName = (new AsciiSlugger())->slug($originalName)->lower()->toString();
        $safeName = $safeName !== '' ? $safeName : 'image';

        $extension = $uploadedFile->guessExtension();
        if (!is_string($extension) || $extension === '') {
            $extension = $this->guessExtensionFromMime((string) $uploadedFile->getMimeType());
        }

        if ($extension === '') {
            $extension = 'bin';
        }

        return sprintf('%s-%s.%s', $safeName, bin2hex(random_bytes(6)), $extension);
    }

    private function guessExtensionFromMime(string $mimeType): string
    {
        return match ($mimeType) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'image/bmp', 'image/x-ms-bmp' => 'bmp',
            'image/svg+xml' => 'svg',
            default => '',
        };
    }
}
