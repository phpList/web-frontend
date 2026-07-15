<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Integration\Controller;

use PhpList\RestApiClient\Endpoint\UploadsClient;
use PhpList\RestApiClient\Exception\ApiException;
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

    public function testAssetsRouteIsRegistered(): void
    {
        self::bootKernel();

        /** @var RouterInterface $router */
        $router = static::getContainer()->get('router');

        self::assertSame('/editor/assets', $router->generate('editor_assets'));
    }

    public function testUploadReturnsAJsonUrl(): void
    {
        $uploadsClient = $this->createMock(UploadsClient::class);
        $uploadsClient->expects(self::once())
            ->method('upload')
            ->willReturn([
                'fileName' => 'newsletter-image.jpg',
                'url' => '/uploadimages/newsletter-image.jpg',
            ]);

        $controller = new EditorUploadController(new EditorUploadService($uploadsClient));

        $response = $controller->upload($this->createUploadRequest());

        self::assertSame(200, $response->getStatusCode());
        $payload = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame('/uploadimages/newsletter-image.jpg', $payload['url']);
        self::assertSame('newsletter-image.jpg', $payload['fileName']);
    }

    public function testUploadReturnsBadRequestWhenNoFileProvided(): void
    {
        $uploadsClient = $this->createMock(UploadsClient::class);
        $uploadsClient->expects(self::never())->method('upload');

        $controller = new EditorUploadController(new EditorUploadService($uploadsClient));

        $response = $controller->upload(Request::create('/editor/upload', 'POST'));

        self::assertSame(400, $response->getStatusCode());
        $payload = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('No file was provided.', $payload['error']['message']);
    }

    public function testUploadReturnsBadRequestWhenApiFails(): void
    {
        $uploadsClient = $this->createMock(UploadsClient::class);
        $uploadsClient->method('upload')
            ->willThrowException(new ApiException('boom', 500));

        $controller = new EditorUploadController(new EditorUploadService($uploadsClient));

        $response = $controller->upload($this->createUploadRequest());

        self::assertSame(400, $response->getStatusCode());
        $payload = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('Upload failed: boom', $payload['error']['message']);
    }

    public function testAssetsReturnsMappedItems(): void
    {
        $uploadsClient = $this->createMock(UploadsClient::class);
        $uploadsClient->expects(self::once())
            ->method('getUploads')
            ->with('uploadimages')
            ->willReturn([
                'files' => [
                    [
                        'name' => 'asset.png',
                        'path' => '/uploadimages/asset.png',
                        'size' => 12,
                        'type' => 'file',
                        'modified' => 100,
                    ],
                ],
            ]);

        $controller = new EditorUploadController(new EditorUploadService($uploadsClient));

        $response = $controller->assets();
        self::assertSame(200, $response->getStatusCode());

        $payload = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertCount(1, $payload['items']);
        self::assertSame('asset.png', $payload['items'][0]['fileName']);
        self::assertTrue($payload['items'][0]['isImage']);
    }

    public function testAssetsReturnsBadRequestWhenApiFails(): void
    {
        $uploadsClient = $this->createMock(UploadsClient::class);
        $uploadsClient->method('getUploads')
            ->willThrowException(new ApiException('unavailable', 500));

        $controller = new EditorUploadController(new EditorUploadService($uploadsClient));

        $response = $controller->assets();

        self::assertSame(400, $response->getStatusCode());
        $payload = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('Failed to list assets: unavailable', $payload['error']['message']);
    }

    private function createUploadRequest(): Request
    {
        $sourceFile = tempnam(sys_get_temp_dir(), 'editor-upload-');
        self::assertIsString($sourceFile);
        file_put_contents($sourceFile, base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO3Z4foAAAAASUVORK5CYII='
        ));

        $uploadedFile = new UploadedFile($sourceFile, 'newsletter-image.jpg', 'image/png', null, true);

        $request = Request::create('/editor/upload', 'POST', [], [], ['upload' => $uploadedFile]);
        $session = new Session(new MockArraySessionStorage());
        $session->set('auth_token', 'integration-token');
        $request->setSession($session);

        return $request;
    }
}
