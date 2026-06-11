<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Integration\Controller;

use PhpList\Core\Domain\Configuration\Model\ConfigOption;
use PhpList\Core\Domain\Configuration\Service\Provider\DefaultConfigProvider;
use PhpList\RestApiClient\Endpoint\AuthClient;
use PhpList\RestApiClient\Endpoint\SubscribePagesClient;
use PhpList\RestApiClient\Entity\SubscribePagePublic;
use PhpList\RestApiClient\Exception\ApiException;
use PhpList\WebFrontend\Controller\PublicSubscribeController;
use PhpList\WebFrontend\Service\LanguageService;
use PhpList\WebFrontend\Service\PublicSubscribeFormBuilder;
use PhpList\WebFrontend\Service\PublicSubscribeFormValidator;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\HttpFoundation\Request;

class PublicSubscribeControllerTest extends KernelTestCase
{
    public function testSubscribePageRendersForAnonymousUserWhenAdminLookupApiFails(): void
    {
        self::bootKernel();

        $subscribePagesClient = $this->createMock(SubscribePagesClient::class);
        $subscribePagesClient->expects(self::once())
            ->method('getPublicSubscribePage')
            ->with(1)
            ->willReturn($this->createPublicSubscribePage());

        $authClient = $this->createMock(AuthClient::class);
        $authClient->expects(self::once())
            ->method('getSessionUser')
            ->willThrowException(new ApiException('API error occurred', 500));

        $config = $this->createMock(DefaultConfigProvider::class);
        $config->expects(self::once())
            ->method('get')
            ->with(ConfigOption::PoweredByImage, [])
            ->willReturn(['value' => '']);

        $container = static::getContainer();
        $formBuilder = $this->createMock(PublicSubscribeFormBuilder::class);
        $formBuilder->expects(self::once())
            ->method('normalizeHtmlChoice')
            ->with('checkforhtml')
            ->willReturn('checkforhtml');
        $formBuilder->expects(self::once())
            ->method('buildAttributeConfig')
            ->willReturn([]);
        $formBuilder->expects(self::once())
            ->method('buildInitialFormData')
            ->willReturn([
                'email' => '',
                'email_confirm' => '',
                'make_confirmed' => '0',
                'htmlemail' => true,
                'selected_lists' => [],
                'attributes' => [],
            ]);

        $controller = new PublicSubscribeController(
            $subscribePagesClient,
            $authClient,
            new LanguageService(),
            $formBuilder,
            $this->createMock(PublicSubscribeFormValidator::class),
            $config,
            false
        );
        $controller->setContainer($container);

        $response = $controller->subscribe(Request::create('/subscribe/1'), 1);
        $content = (string) $response->getContent();

        self::assertSame(200, $response->getStatusCode());
        self::assertStringContainsString('form method="post"', $content);
        self::assertStringContainsString('name="email"', $content);
        self::assertStringContainsString('type="email"', $content);
        self::assertStringContainsString('type="submit"', $content);
        self::assertStringNotContainsString('adminmessage', $content);
    }

    private function createPublicSubscribePage(): SubscribePagePublic
    {
        return new SubscribePagePublic([
            'id' => 1,
            'title' => 'Subscribe to our newsletter',
            'data' => [
                'button' => 'Subscribe',
                'htmlchoice' => 'checkforhtml',
                'intro' => '<p>Subscribe to our newsletter</p>',
            ],
        ]);
    }
}
