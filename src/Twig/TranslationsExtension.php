<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Twig;

use Symfony\Component\Translation\MessageCatalogueInterface;
use Symfony\Component\Translation\TranslatorBagInterface;
use Symfony\Contracts\Translation\TranslatorInterface;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

/**
 * Exposes the `frontend` translation domain to the Vue app.
 *
 * Usage: <script type="application/json" id="i18n-messages">{{ frontend_messages_json() }}</script>
 */
class TranslationsExtension extends AbstractExtension
{
    public const DOMAIN = 'frontend';

    public function __construct(private readonly TranslatorInterface $translator)
    {
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('frontend_messages_json', [$this, 'getMessagesJson'], ['is_safe' => ['html']]),
        ];
    }

    /**
     * Raw (unformatted) ICU messages for the current locale, with fallback-locale
     * messages filling any gaps. Returned as JSON that is safe to embed in a <script> tag.
     */
    public function getMessagesJson(): string
    {
        return json_encode(
            (object) $this->getMessages(),
            JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR
        );
    }

    /**
     * @return array<string, string>
     */
    public function getMessages(): array
    {
        if (!$this->translator instanceof TranslatorBagInterface) {
            return [];
        }

        $messages = [];
        $catalogue = $this->translator->getCatalogue($this->translator->getLocale());

        // Walk the fallback chain (e.g. es_AR -> es -> en); earlier catalogues win.
        while ($catalogue instanceof MessageCatalogueInterface) {
            $messages += $catalogue->all(self::DOMAIN);
            $catalogue = $catalogue->getFallbackCatalogue();
        }

        ksort($messages);

        return $messages;
    }
}
