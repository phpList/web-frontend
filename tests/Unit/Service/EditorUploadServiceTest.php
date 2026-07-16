<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\Service;

use PhpList\RestApiClient\Endpoint\UploadsClient;
use PhpList\RestApiClient\Exception\ApiException;
use PhpList\RestApiClient\Exception\AuthenticationException;
use PhpList\RestApiClient\Exception\NotFoundException;
use PhpList\WebFrontend\Exception\UpstreamServiceException;
use PhpList\WebFrontend\Service\EditorUploadService;
use PHPUnit\Framework\TestCase;
use RuntimeException;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final class EditorUploadServiceTest extends TestCase
{
    public function testStoreImageUploadsThroughApiAndReturnsResult(): void
    {
        $uploadsClient = $this->createMock(UploadsClient::class);
        $uploadsClient->expects(self::once())
            ->method('upload')
            ->with(
                self::callback(static fn (string $path): bool => str_ends_with($path, '.png')),
                'upload'
            )
            ->willReturn([
                'fileName' => 'hero-image.png',
                'url' => '/uploadimages/hero-image.png',
            ]);

        $service = new EditorUploadService($uploadsClient);
        $result = $service->storeImage($this->createImageUpload());

        self::assertSame('hero-image.png', $result->fileName);
        self::assertSame('/uploadimages/hero-image.png', $result->relativeUrl);
    }

    public function testStoreImageFallsBackToClientNameAndBuiltUrl(): void
    {
        $uploadsClient = $this->createMock(UploadsClient::class);
        $uploadsClient->method('upload')->willReturn([]);

        $service = new EditorUploadService($uploadsClient);
        $result = $service->storeImage($this->createImageUpload('hero image.png'));

        self::assertSame('hero image.png', $result->fileName);
        self::assertSame('/uploadimages/hero image.png', $result->relativeUrl);
    }

    public function testStoreImageRejectsNonImageUploads(): void
    {
        $uploadsClient = $this->createMock(UploadsClient::class);
        $uploadsClient->expects(self::never())->method('upload');

        $sourceFile = tempnam(sys_get_temp_dir(), 'editor-upload-');
        self::assertIsString($sourceFile);
        file_put_contents($sourceFile, 'just some plain text, definitely not an image');
        $upload = new UploadedFile($sourceFile, 'notes.txt', 'text/plain', null, true);

        $service = new EditorUploadService($uploadsClient);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Only image uploads are supported.');

        $service->storeImage($upload);
    }

    public function testStoreImageRejectsFilesExceedingMaxSize(): void
    {
        $uploadsClient = $this->createMock(UploadsClient::class);
        $uploadsClient->expects(self::never())->method('upload');

        $sourceFile = tempnam(sys_get_temp_dir(), 'editor-upload-');
        self::assertIsString($sourceFile);
        // Write just over the 10 MB limit so the size check trips before upload.
        file_put_contents($sourceFile, str_repeat("\0", 10 * 1024 * 1024 + 1));
        $upload = new UploadedFile($sourceFile, 'huge.png', 'image/png', null, true);

        $service = new EditorUploadService($uploadsClient);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('The uploaded file exceeds the maximum allowed size of 10 MB.');

        $service->storeImage($upload);
    }

    public function testStoreImageWrapsApiErrorsInUpstreamServiceException(): void
    {
        $uploadsClient = $this->createMock(UploadsClient::class);
        $uploadsClient->method('upload')
            ->willThrowException(new ApiException('boom', 500));

        $service = new EditorUploadService($uploadsClient);

        $this->expectException(UpstreamServiceException::class);
        $this->expectExceptionMessage('Upload failed: boom');

        $service->storeImage($this->createImageUpload());
    }

    public function testStoreImageRethrowsAuthenticationException(): void
    {
        $uploadsClient = $this->createMock(UploadsClient::class);
        $uploadsClient->method('upload')
            ->willThrowException(new AuthenticationException('Session expired', 401));

        $service = new EditorUploadService($uploadsClient);

        $this->expectException(AuthenticationException::class);

        $service->storeImage($this->createImageUpload());
    }

    public function testListAssetsMapsApiFieldsAndSortsByNewestFirst(): void
    {
        $uploadsClient = $this->createMock(UploadsClient::class);
        $uploadsClient->expects(self::once())
            ->method('getUploads')
            ->with('uploadimages')
            ->willReturn([
                // Real API listing shape: name/path/size/type/modified, no mimeType.
                'files' => [
                    [
                        'name' => 'image-one.png',
                        'path' => '/uploadimages/image-one.png',
                        'size' => 120,
                        'type' => 'file',
                        'modified' => 100,
                    ],
                    [
                        'name' => 'notes.txt',
                        'path' => '/uploadimages/notes.txt',
                        'size' => 8,
                        'type' => 'file',
                        'modified' => 200,
                    ],
                ],
            ]);

        $service = new EditorUploadService($uploadsClient);
        $assets = $service->listAssets();

        self::assertCount(2, $assets);
        self::assertSame('notes.txt', $assets[1]->fileName);
        self::assertFalse($assets[1]->isImage);
        self::assertSame('/uploadimages/notes.txt', $assets[1]->url);
        self::assertSame('image-one.png', $assets[0]->fileName);
        self::assertTrue($assets[0]->isImage);
        self::assertSame('image/png', $assets[0]->mimeType);
        self::assertSame(100, $assets[0]->modifiedAt);
    }

    public function testListAssetsSkipsDirectoriesAndUnnamedEntries(): void
    {
        $uploadsClient = $this->createMock(UploadsClient::class);
        $uploadsClient->method('getUploads')->willReturn([
            'files' => [
                ['type' => 'file'],
                ['name' => 'nested', 'type' => 'directory'],
                ['name' => 'kept.png', 'type' => 'file', 'path' => '/uploads/kept.png', 'size' => '2MB'],
            ],
        ]);

        $service = new EditorUploadService($uploadsClient);
        $assets = $service->listAssets();

        self::assertCount(1, $assets);
        self::assertSame('kept.png', $assets[0]->fileName);
    }

    public function testListAssetsReturnsEmptyWhenDirectoryMissing(): void
    {
        $uploadsClient = $this->createMock(UploadsClient::class);
        $uploadsClient->method('getUploads')
            ->willThrowException(new NotFoundException('Directory "uploadimages" not found.', 404));

        $service = new EditorUploadService($uploadsClient);

        self::assertSame([], $service->listAssets());
    }

    public function testListAssetsWrapsApiErrorsInUpstreamServiceException(): void
    {
        $uploadsClient = $this->createMock(UploadsClient::class);
        $uploadsClient->method('getUploads')
            ->willThrowException(new ApiException('unavailable', 500));

        $service = new EditorUploadService($uploadsClient);

        $this->expectException(UpstreamServiceException::class);
        $this->expectExceptionMessage('Failed to list assets: unavailable');

        $service->listAssets();
    }

    public function testListAssetsRethrowsAuthenticationException(): void
    {
        $uploadsClient = $this->createMock(UploadsClient::class);
        $uploadsClient->method('getUploads')
            ->willThrowException(new AuthenticationException('Session expired', 401));

        $service = new EditorUploadService($uploadsClient);

        $this->expectException(AuthenticationException::class);

        $service->listAssets();
    }

    private function createImageUpload(string $clientName = 'newsletter-image.png'): UploadedFile
    {
        return new UploadedFile($this->createSourceFile(), $clientName, 'image/png', null, true);
    }

    private function createSourceFile(): string
    {
        $sourceFile = tempnam(sys_get_temp_dir(), 'editor-upload-');
        self::assertIsString($sourceFile);
        file_put_contents($sourceFile, base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO3Z4foAAAAASUVORK5CYII='
        ));

        return $sourceFile;
    }
}
