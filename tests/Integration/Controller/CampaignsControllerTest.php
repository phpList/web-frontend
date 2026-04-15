<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Integration\Controller;

use PhpList\WebFrontend\Controller\CampaignsController;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\HttpFoundation\Session\Storage\MockArraySessionStorage;
use Symfony\Component\Routing\RouterInterface;

class CampaignsControllerTest extends KernelTestCase
{
    /**
     * @dataProvider routesProvider
     */
    public function testCampaignRoutesAreRegistered(string $routeName, array $parameters, string $expectedPath): void
    {
        self::bootKernel();
        /** @var RouterInterface $router */
        $router = static::getContainer()->get('router');

        self::assertSame($expectedPath, $router->generate($routeName, $parameters));
    }

    /**
     * @dataProvider pageProvider
     */
    public function testCampaignPagesRenderExpectedSpaPayload(
        string $action,
        array $actionArguments,
        string $expectedPageTitle
    ): void {
        self::bootKernel();
        /** @var CampaignsController $controller */
        $controller = static::getContainer()->get(CampaignsController::class);

        $request = Request::create('/campaigns/');
        $session = new Session(new MockArraySessionStorage());
        $session->set('auth_token', 'integration-token');
        $request->setSession($session);

        $response = $controller->{$action}($request, ...$actionArguments);

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString(
            sprintf('<title>phpList - %s</title>', $expectedPageTitle),
            (string) $response->getContent()
        );
        self::assertStringContainsString(
            'data-api-token="integration-token"',
            (string) $response->getContent()
        );
        self::assertStringContainsString(
            'data-api-base-url="http://api.phplist.local/"',
            (string) $response->getContent()
        );
    }

    /**
     * @return array<string, array{string, array<string, int>, string}>
     */
    public function pageProvider(): array
    {
        return [
            'index page' => ['index', [], 'Campaigns'],
            'create page' => ['create', [], 'Create Campaign'],
            'edit page' => ['edit', ['campaignId' => 123], 'Edit Campaign #123'],
        ];
    }

    /**
     * @return array<string, array{string, array<string, int>, string}>
     */
    public function routesProvider(): array
    {
        return [
            'list route' => ['campaign_list', [], '/campaigns/'],
            'create route' => ['campaign_create', [], '/campaigns/create'],
            'edit route' => ['campaign_edit', ['campaignId' => 123], '/campaigns/123/edit'],
        ];
    }
}
