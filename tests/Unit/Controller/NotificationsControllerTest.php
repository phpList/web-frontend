<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\Controller;

use PhpList\RestApiClient\Client;
use PhpList\RestApiClient\Exception\ApiException;
use PhpList\RestApiClient\Exception\AuthenticationException;
use PhpList\WebFrontend\Controller\NotificationsController;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\HttpFoundation\Session\Storage\MockArraySessionStorage;

class NotificationsControllerTest extends TestCase
{
    private function request(): Request
    {
        $session = new Session(new MockArraySessionStorage());
        $session->set('auth_token', 'tok');
        $request = new Request();
        $request->setSession($session);

        return $request;
    }

    public function testReturnsItemsFromApi(): void
    {
        $client = $this->createMock(Client::class);
        $client->expects(self::once())->method('setSessionId')->with('tok');
        $client->method('get')->with('notifications')->willReturn(
            ['items' => [['code' => 'a', 'level' => 'info', 'message' => 'M', 'context' => []]]]
        );

        $response = (new NotificationsController($client, $this->createMock(LoggerInterface::class)))
            ->index($this->request());

        self::assertSame(200, $response->getStatusCode());
        self::assertSame('a', json_decode($response->getContent(), true)['items'][0]['code']);
    }

    public function testAuthenticationFailureReturns401(): void
    {
        $client = $this->createMock(Client::class);
        $client->method('get')->willThrowException(new AuthenticationException('no'));

        $response = (new NotificationsController($client, $this->createMock(LoggerInterface::class)))
            ->index($this->request());

        self::assertSame(401, $response->getStatusCode());
    }

    public function testApiFailureReturns502(): void
    {
        $client = $this->createMock(Client::class);
        $client->method('get')->willThrowException(new ApiException('boom'));

        $response = (new NotificationsController($client, $this->createMock(LoggerInterface::class)))
            ->index($this->request());

        self::assertSame(502, $response->getStatusCode());
    }
}
