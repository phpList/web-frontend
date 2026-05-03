<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Integration\Controller;

use PhpList\RestApiClient\Endpoint\ListClient;
use PhpList\RestApiClient\Response\Subscribers\SubscriberListCollection;
use PhpList\WebFrontend\Controller\ListsController;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\HttpFoundation\Session\Storage\MockArraySessionStorage;
use Symfony\Component\Routing\RouterInterface;

class ListsControllerTest extends KernelTestCase
{
    /**
     * @dataProvider routesProvider
     */
    public function testListRoutesAreRegistered(string $routeName, array $parameters, string $expectedPath): void
    {
        self::bootKernel();
        /** @var RouterInterface $router */
        $router = static::getContainer()->get('router');

        self::assertSame($expectedPath, $router->generate($routeName, $parameters));
    }

    public function testListsIndexRendersSpaForHtmlRequests(): void
    {
        self::bootKernel();
        $apiBaseUrl = (string) static::getContainer()->getParameter('api_base_url');

        $listClient = $this->createMock(ListClient::class);
        $listClient->expects(self::never())->method('getLists');

        $controller = new ListsController($listClient);
        $controller->setContainer(static::getContainer());

        $request = $this->createRequestWithSession('/lists/');
        $response = $controller->index($request);
        $content = (string) $response->getContent();

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('<title>phpList - Lists</title>', $content);
        self::assertStringContainsString('data-api-token="integration-token"', $content);
        self::assertStringContainsString(sprintf('data-api-base-url="%s"', $apiBaseUrl), $content);
    }

    public function testListsIndexReturnsJsonForJsonRequests(): void
    {
        self::bootKernel();

        $listClient = $this->createMock(ListClient::class);
        $listClient->expects(self::once())
            ->method('getLists')
            ->willReturn($this->createListsCollection());

        $controller = new ListsController($listClient);
        $controller->setContainer(static::getContainer());

        $request = $this->createRequestWithSession('/lists/');
        $request->headers->set('Accept', 'application/json');

        $response = $controller->index($request);
        $content = (string) $response->getContent();

        self::assertInstanceOf(JsonResponse::class, $response);
        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('News', $content);
    }

    public function testListSubscribersViewRendersSpa(): void
    {
        self::bootKernel();

        $listClient = $this->createMock(ListClient::class);
        $controller = new ListsController($listClient);
        $controller->setContainer(static::getContainer());

        $request = $this->createRequestWithSession('/lists/11/subscribers');
        $response = $controller->view($request, 11);
        $content = (string) $response->getContent();

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('<title>phpList - List Subscribers</title>', $content);
        self::assertStringContainsString('data-api-token="integration-token"', $content);
    }

    /**
     * @return array<string, array{string, array<string, int>, string}>
     */
    public function routesProvider(): array
    {
        return [
            'lists route' => ['list_list', [], '/lists/'],
            'list subscribers route' => ['list_list_subscribers', ['listId' => 11], '/lists/11/subscribers'],
        ];
    }

    private function createRequestWithSession(string $path): Request
    {
        $request = Request::create($path);
        $session = new Session(new MockArraySessionStorage());
        $session->set('auth_token', 'integration-token');
        $request->setSession($session);

        return $request;
    }

    private function createListsCollection(): SubscriberListCollection
    {
        return new SubscriberListCollection([
            'items' => [
                [
                    'id' => 1,
                    'name' => 'News',
                    'created_at' => '2026-04-01 12:00:00',
                    'description' => 'Main list',
                    'public' => true,
                ],
            ],
            'pagination' => [
                'total' => 1,
                'limit' => 25,
                'has_more' => false,
                'next_cursor' => null,
            ],
        ]);
    }
}
