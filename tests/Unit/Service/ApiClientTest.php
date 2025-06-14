<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\Service;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Psr7\Response;
use PhpList\WebFrontend\Service\ApiClient;
use PHPUnit\Framework\TestCase;
use ReflectionClass;
use RuntimeException;

class ApiClientTest extends TestCase
{
    private const BASE_URL = 'http://api.example.com';
    private MockHandler $mockHandler;
    private array $container = [];
    private ApiClient $apiClient;

    protected function setUp(): void
    {
        $this->mockHandler = new MockHandler();
        $history = Middleware::history($this->container);
        $handlerStack = HandlerStack::create($this->mockHandler);
        $handlerStack->push($history);

        $client = new Client(['handler' => $handlerStack]);

        $apiClient = new ApiClient(self::BASE_URL);
        $reflection = new ReflectionClass($apiClient);
        $clientProperty = $reflection->getProperty('client');
        $clientProperty->setValue($apiClient, $client);

        $this->apiClient = $apiClient;
    }

    public function testAuthenticateSuccess(): void
    {
        $this->mockHandler->append(
            new Response(200, [], json_encode(['key' => 'test-token']))
        );

        $result = $this->apiClient->authenticate('testuser', 'testpass');

        $this->assertCount(1, $this->container);
        $request = $this->container[0]['request'];
        $this->assertEquals('POST', $request->getMethod());
        $this->assertEquals('/api/v2/sessions', $request->getUri()->getPath());

        $body = json_decode($request->getBody()->getContents(), true);
        $this->assertEquals('testuser', $body['loginName']);
        $this->assertEquals('testpass', $body['password']);

        $this->assertArrayHasKey('key', $result);
        $this->assertEquals('test-token', $result['key']);
    }

    public function testAuthenticateFailureNoToken(): void
    {
        $this->mockHandler->append(
            new Response(200, [], json_encode(['status' => 'error']))
        );

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Authentication failed: No token received');

        $this->apiClient->authenticate('testuser', 'testpass');
    }

    public function testAuthenticateFailureUnauthorized(): void
    {
        $this->mockHandler->append(
            new ClientException(
                'Unauthorized',
                new Request('POST', '/api/v2/sessions'),
                new Response(401)
            )
        );

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Invalid credentials');
        $this->expectExceptionCode(401);

        $this->apiClient->authenticate('testuser', 'wrongpass');
    }

    public function testSetAuthToken(): void
    {
        $token = 'test-token';
        $this->apiClient->setAuthToken($token);

        $this->mockHandler->append(
            new Response(200, [], json_encode(['success' => true]))
        );

        $reflection = new ReflectionClass($this->apiClient);
        $method = $reflection->getMethod('request');
        $method->invoke($this->apiClient, 'GET', '/test');

        $this->assertCount(1, $this->container);
        $request = $this->container[0]['request'];
        $this->assertEquals('Bearer ' . $token, $request->getHeaderLine('Authorization'));
    }

    public function testRequestWithoutAuthToken(): void
    {
        $this->mockHandler->append(
            new Response(200, [], json_encode(['success' => true]))
        );

        $reflection = new ReflectionClass($this->apiClient);
        $method = $reflection->getMethod('request');
        $method->invoke($this->apiClient, 'GET', '/test');

        $this->assertCount(1, $this->container);
        $request = $this->container[0]['request'];
        $this->assertFalse($request->hasHeader('Authorization'));
    }
}
