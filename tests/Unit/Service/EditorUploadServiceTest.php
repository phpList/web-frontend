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

        @unlink($projectDir . '/public/uploadimages/ckeditor5/' . $result->fileName);
        @rmdir($projectDir . '/public/uploadimages/ckeditor5');
        @rmdir($projectDir . '/public/uploadimages');
        @rmdir($projectDir . '/public');
        @rmdir($projectDir);
    }
}
