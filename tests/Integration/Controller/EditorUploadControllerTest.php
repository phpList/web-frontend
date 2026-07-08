<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Integration\Controller;

use PhpList\WebFrontend\Controller\EditorUploadController;
use PhpList\WebFrontend\Service\EditorUploadService;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\HttpFoundation\Session\Storage\MockArraySessionStorage;
use Symfony\Component\Routing\RouterInterface;

final class EditorUploadControllerTest extends KernelTestCase
{
    public function testUploadRouteIsRegistered(): void
    {
        self::bootKernel();

        /** @var RouterInterface $router */
        $router = static::getContainer()->get('router');

        self::assertSame('/editor/upload', $router->generate('editor_upload'));
    }

    public function testUploadReturnsAJsonUrl(): void
    {
        self::bootKernel();

        $projectDir = sys_get_temp_dir() . '/phplist-editor-upload-' . bin2hex(random_bytes(4));
        $service = new EditorUploadService($projectDir, 'uploadimages');
        $controller = new EditorUploadController($service);

        $sourceFile = tempnam(sys_get_temp_dir(), 'editor-upload-');
        self::assertIsString($sourceFile);
        file_put_contents($sourceFile, base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO3Z4foAAAAASUVORK5CYII='
        ));

        $uploadedFile = new UploadedFile(
            $sourceFile,
            'newsletter-image.jpg',
            'image/jpeg',
            null,
            true
        );

        $request = Request::create('/editor/upload', 'POST', [], [], [
            'upload' => $uploadedFile,
        ]);
        $session = new Session(new MockArraySessionStorage());
        $session->set('auth_token', 'integration-token');
        $request->setSession($session);

        $response = $controller->upload($request);

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertArrayHasKey('url', $payload);
        self::assertArrayHasKey('fileName', $payload);
        self::assertSame('/uploadimages/ckeditor5/' . $payload['fileName'], $payload['url']);
        self::assertFileExists($projectDir . '/public/uploadimages/ckeditor5/' . $payload['fileName']);

        if (is_file($sourceFile)) {
            unlink($sourceFile);
        }
        $uploadedFile = $projectDir . '/public/uploadimages/ckeditor5/' . $payload['fileName'];
        if (is_file($uploadedFile)) {
            unlink($uploadedFile);
        }
        $this->removePath($projectDir . '/public/uploadimages/ckeditor5');
        $this->removePath($projectDir . '/public/uploadimages');
        $this->removePath($projectDir . '/public');
        $this->removePath($projectDir);
    }

    public function testAssetsRouteReturnsExistingFiles(): void
    {
        self::bootKernel();

        $projectDir = sys_get_temp_dir() . '/phplist-editor-assets-' . bin2hex(random_bytes(4));
        $service = new EditorUploadService($projectDir, 'uploadimages');
        $controller = new EditorUploadController($service);

        $directory = $projectDir . '/public/uploadimages/ckeditor5';
        mkdir($directory, 0755, true);
        file_put_contents($directory . '/asset.txt', 'asset');

        $response = $controller->assets();
        self::assertSame(200, $response->getStatusCode());

        $payload = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertArrayHasKey('items', $payload);
        self::assertCount(1, $payload['items']);
        self::assertSame('asset.txt', $payload['items'][0]['fileName']);

        $this->removePath($directory . '/asset.txt');
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
