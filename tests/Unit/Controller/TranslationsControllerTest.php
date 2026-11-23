<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\Controller;

use PhpList\WebFrontend\Controller\TranslationsController;
use PhpList\WebFrontend\Twig\TranslationsExtension;
use PHPUnit\Framework\TestCase;
use Symfony\Component\DependencyInjection\Container;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Translation\Loader\XliffFileLoader;
use Symfony\Component\Translation\Translator;

class TranslationsControllerTest extends TestCase
{
    private TranslationsController $controller;

    protected function setUp(): void
    {
        $translator = new Translator('en');
        $translator->setFallbackLocales(['en']);
        $translator->addLoader('xlf', new XliffFileLoader());
        foreach (['en', 'es'] as $locale) {
            $translator->addResource(
                'xlf',
                __DIR__ . '/../../../translations/frontend+intl-icu.' . $locale . '.xlf',
                $locale,
                'frontend+intl-icu'
            );
        }

        $this->controller = new TranslationsController(new TranslationsExtension($translator, ['en', 'es']));
        $this->controller->setContainer(new Container());
    }

    public function testServesTheCatalogueOfAnOfferedLocale(): void
    {
        $response = $this->controller->messages(Request::create('/translations/es.json'), 'es');

        $this->assertSame(200, $response->getStatusCode());
        $this->assertTrue($response->headers->hasCacheControlDirective('private'));
        $messages = json_decode((string) $response->getContent(), true);
        $this->assertSame('Panel', $messages['sidebar.nav.dashboard']);
        $this->assertSame('Cerrar sesión', $messages['sidebar.logout']);
    }

    public function testAnswersNotModifiedForAMatchingEtag(): void
    {
        $first = $this->controller->messages(Request::create('/translations/en.json'), 'en');

        $request = Request::create('/translations/en.json');
        $request->headers->set('If-None-Match', (string) $first->getEtag());
        $second = $this->controller->messages($request, 'en');

        $this->assertSame(304, $second->getStatusCode());
    }

    public function testRejectsLocalesThatAreNotOffered(): void
    {
        $response = $this->controller->messages(Request::create('/translations/xx.json'), 'xx');

        $this->assertSame(404, $response->getStatusCode());
    }
}
