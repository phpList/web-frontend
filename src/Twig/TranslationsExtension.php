<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Twig;

use Locale;
use Symfony\Component\Translation\MessageCatalogueInterface;
use Symfony\Component\Translation\TranslatorBagInterface;
use Symfony\Contracts\Translation\TranslatorInterface;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

/**
 * Exposes the `frontend` translation domain to the Vue app.
 *
 * Served to the Vue app by TranslationsController (/translations/<locale>.json).
 */
class TranslationsExtension extends AbstractExtension
{
    public const DOMAIN = 'frontend';

    /**
     * @param string[] $supportedLocales
     */
    public function __construct(
        private readonly TranslatorInterface $translator,
        private readonly array $supportedLocales = [],
    ) {
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('frontend_locales', [$this, 'getLocales']),
            new TwigFunction('frontend_locales_json', [$this, 'getLocalesJson'], ['is_safe' => ['html']]),
        ];
    }

    /**
     * @return string[]
     */
    public function getSupportedLocales(): array
    {
        return $this->supportedLocales;
    }

    /**
     * Languages offered in the language selector, as [code => name written in that language],
     * e.g. ['en' => 'English', 'es' => 'Español'].
     *
     * @return array<string, string>
     */
    public function getLocales(): array
    {
        $locales = [];
        foreach ($this->supportedLocales as $code) {
            $name = class_exists(Locale::class) ? Locale::getDisplayLanguage($code, $code) : '';
            $locales[$code] = $name !== '' && $name !== $code ? mb_convert_case($name, MB_CASE_TITLE) : $code;
        }

        return $locales;
    }

    public function getLocalesJson(): string
    {
        return json_encode(
            (object) $this->getLocales(),
            JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
        );
    }

    /**
     * Raw (unformatted) ICU messages for the locale (default: the current one), with
     * fallback-locale messages filling any gaps.
     *
     * @return array<string, string>
     */
    public function getMessages(?string $locale = null): array
    {
        if (!$this->translator instanceof TranslatorBagInterface) {
            return [];
        }

        $messages = [];
        $catalogue = $this->translator->getCatalogue($locale ?? $this->translator->getLocale());

        // Walk the fallback chain (e.g. es_AR -> es -> en); earlier catalogues win.
        while ($catalogue instanceof MessageCatalogueInterface) {
            $messages += $catalogue->all(self::DOMAIN);
            $catalogue = $catalogue->getFallbackCatalogue();
        }

        ksort($messages);

        return $messages;
    }
}
