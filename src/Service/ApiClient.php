<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Service;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use JsonException;
use RuntimeException;

class ApiClient
{
    private Client $client;
    private ?string $authToken = null;

    public function __construct(string $baseUrl)
    {
        $this->client = new Client([
            'base_uri' => $baseUrl,
            'headers' => [
                'Authorization' => 'Bearer ' . $this->authToken,
                'Accept' => 'application/json',
            ]
        ]);
    }

    /**
     * @throws GuzzleException
     * @throws RuntimeException
     */
    public function authenticate(string $username, string $password): array
    {
        try {
            $response = $this->request('POST', '/api/v2/sessions', [
                'json' => [
                    'loginName' => $username,
                    'password' => $password,
                ]
            ]);

            if (!isset($response['key'])) {
                throw new RuntimeException('Authentication failed: No token received');
            }

            return $response;
        } catch (GuzzleException $e) {
            if ($e->getCode() === 401) {
                throw new RuntimeException('Invalid credentials', 401, $e);
            }
            throw $e;
        }
    }

    public function setAuthToken(string $token): void
    {
        $this->authToken = $token;
    }

    /**
     * @throws GuzzleException
     * @throws JsonException
     */
    private function request(string $method, string $endpoint, array $options = []): array
    {
        if ($this->authToken) {
            $options['headers'] = [
                'Authorization' => 'Bearer ' . $this->authToken,
                ...$options['headers'] ?? [],
            ];
        }

        $response = $this->client->request($method, $endpoint, $options);

        return json_decode(
            $response->getBody()->getContents(),
            true,
            512,
            JSON_THROW_ON_ERROR
        );
    }
}
