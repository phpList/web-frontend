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
        $payload = $response->toArray();

        self::assertArrayHasKey('url', $payload);
        self::assertArrayHasKey('fileName', $payload);
        self::assertSame('/uploadimages/ckeditor5/' . $payload['fileName'], $payload['url']);
        self::assertFileExists($projectDir . '/public/uploadimages/ckeditor5/' . $payload['fileName']);

        @unlink($sourceFile);
        if (is_file($projectDir . '/public/uploadimages/ckeditor5/' . $payload['fileName'])) {
            @unlink($projectDir . '/public/uploadimages/ckeditor5/' . $payload['fileName']);
        }
        @rmdir($projectDir . '/public/uploadimages/ckeditor5');
        @rmdir($projectDir . '/public/uploadimages');
        @rmdir($projectDir . '/public');
        @rmdir($projectDir);
    }
}
