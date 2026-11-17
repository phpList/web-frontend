<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\Twig;

use PhpList\WebFrontend\Twig\TranslationsExtension;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Translation\Loader\ArrayLoader;
use Symfony\Component\Translation\Loader\XliffFileLoader;
use Symfony\Component\Translation\Translator;
use Symfony\Contracts\Translation\TranslatorInterface;

class TranslationsExtensionTest extends TestCase
{
    private const TRANSLATIONS_DIR = __DIR__ . '/../../../translations';

    public function testRegistersTheLocalesFunction(): void
    {
        $extension = new TranslationsExtension($this->createTranslator('en'));
        $function = $extension->getFunctions()[0];

        $this->assertSame('frontend_locales', $function->getName());
    }

    public function testReturnsTheRealEnglishCatalogue(): void
    {
        $messages = (new TranslationsExtension($this->createTranslator('en')))->getMessages();

        $this->assertSame('Dashboard', $messages['sidebar.nav.dashboard']);
        $this->assertSame('phpList v{version}', $messages['auth.footer.version'], 'messages must stay unformatted');
    }

    public function testMergesFallbackMessagesUnderTheCurrentLocale(): void
    {
        $translator = $this->createTranslator('es');
        $translator->addResource('array', ['test.only_in_english' => 'Only in English'], 'en', 'frontend+intl-icu');

        $messages = (new TranslationsExtension($translator))->getMessages();

        $this->assertSame('Panel', $messages['sidebar.nav.dashboard']);
        $this->assertSame('Only in English', $messages['test.only_in_english']);
    }

    public function testDoesNotLeakOtherDomains(): void
    {
        $translator = $this->createTranslator('en');
        $translator->addResource('array', ['core.message' => 'Core'], 'en', 'messages');

        $messages = (new TranslationsExtension($translator))->getMessages();

        $this->assertArrayNotHasKey('core.message', $messages);
    }

    public function testReturnsNoMessagesWithoutACatalogueAwareTranslator(): void
    {
        $translator = $this->createMock(TranslatorInterface::class);

        $this->assertSame([], (new TranslationsExtension($translator))->getMessages());
    }

    public function testReturnsMessagesOfAnExplicitLocale(): void
    {
        $messages = (new TranslationsExtension($this->createTranslator('en')))->getMessages('es');

        $this->assertSame('Panel', $messages['sidebar.nav.dashboard']);
    }

    public function testTwigSideFormatsIcuMessages(): void
    {
        $translator = $this->createTranslator('es');

        $this->assertSame(
            'phpList v4.0.0',
            $translator->trans('auth.footer.version', ['version' => '4.0.0'], TranslationsExtension::DOMAIN)
        );
        $this->assertSame('Iniciar sesión', $translator->trans('auth.login.submit', [], TranslationsExtension::DOMAIN));
    }

    private function createTranslator(string $locale): Translator
    {
        $translator = new Translator($locale);
        $translator->setFallbackLocales(['en']);
        $translator->addLoader('xlf', new XliffFileLoader());
        $translator->addLoader('array', new ArrayLoader());

        foreach (glob(self::TRANSLATIONS_DIR . '/frontend+intl-icu.*.xlf') as $file) {
            preg_match('/frontend\+intl-icu\.(\w+)\.xlf$/', $file, $match);
            $translator->addResource('xlf', $file, $match[1], 'frontend+intl-icu');
        }

        return $translator;
    }

    public function testListsSupportedLocalesNamedInTheirOwnLanguage(): void
    {
        $extension = new TranslationsExtension($this->createTranslator('en'), ['en', 'es']);

        $this->assertSame(['en' => 'English', 'es' => 'Español'], $extension->getLocales());
        $this->assertSame('{"en":"English","es":"Español"}', $extension->getLocalesJson());
    }

    public function testNoLocalesWithoutConfiguration(): void
    {
        $extension = new TranslationsExtension($this->createTranslator('en'));

        $this->assertSame([], $extension->getLocales());
        $this->assertSame('{}', $extension->getLocalesJson());
    }
}
