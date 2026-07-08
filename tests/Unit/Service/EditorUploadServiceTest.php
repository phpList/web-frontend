<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\Service;

use PhpList\WebFrontend\Service\EditorUploadService;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\File\UploadedFile;

final class EditorUploadServiceTest extends TestCase
{
    public function testStoreImageMovesTheFileAndBuildsAPublicUrl(): void
    {
        $projectDir = sys_get_temp_dir() . '/phplist-editor-upload-' . bin2hex(random_bytes(4));
        $service = new EditorUploadService($projectDir, 'uploadimages');

        $sourceFile = tempnam(sys_get_temp_dir(), 'editor-upload-');
        self::assertIsString($sourceFile);
        file_put_contents($sourceFile, base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO3Z4foAAAAASUVORK5CYII='
        ));

        $uploadedFile = new UploadedFile(
            $sourceFile,
            'hero image.png',
            'image/png',
            null,
            true
        );

        $result = $service->storeImage($uploadedFile);

        self::assertStringEndsWith('.png', $result->fileName);
        self::assertSame('/uploadimages/ckeditor5/' . $result->fileName, $result->relativeUrl);
        self::assertFileExists($projectDir . '/public/uploadimages/ckeditor5/' . $result->fileName);

        $this->removePath($projectDir . '/public/uploadimages/ckeditor5/' . $result->fileName);
        $this->removePath($projectDir . '/public/uploadimages/ckeditor5');
        $this->removePath($projectDir . '/public/uploadimages');
        $this->removePath($projectDir . '/public');
        $this->removePath($projectDir);
    }

    public function testListAssetsReturnsUploadedFilesSortedByNewestFirst(): void
    {
        $projectDir = sys_get_temp_dir() . '/phplist-editor-assets-' . bin2hex(random_bytes(4));
        $service = new EditorUploadService($projectDir, 'uploadimages');

        $directory = $projectDir . '/public/uploadimages/ckeditor5';
        mkdir($directory, 0755, true);

        $imagePath = $directory . '/image-one.png';
        file_put_contents($imagePath, base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO3Z4foAAAAASUVORK5CYII='
        ));
        touch($imagePath, time() - 60);

        $filePath = $directory . '/notes.txt';
        file_put_contents($filePath, 'notes');

        $assets = $service->listAssets();

        self::assertCount(2, $assets);
        self::assertSame('notes.txt', $assets[0]->fileName);
        self::assertFalse($assets[0]->isImage);
        self::assertSame('/uploadimages/ckeditor5/notes.txt', $assets[0]->url);
        self::assertSame('image-one.png', $assets[1]->fileName);
        self::assertTrue($assets[1]->isImage);

        $this->removePath($imagePath);
        $this->removePath($filePath);
        $this->removePath($directory);
        $this->removePath($projectDir . '/public/uploadimages');
        $this->removePath($projectDir . '/public');
        $this->removePath($projectDir);
    }

    private function removePath(string $path): void
    {
        if (is_file($path) || is_link($path)) {
            unlink($path);

            return;
        }

        if (!is_dir($path)) {
            return;
        }

        foreach (scandir($path) as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }

            $this->removePath($path . DIRECTORY_SEPARATOR . $item);
        }

        rmdir($path);
    }
}
