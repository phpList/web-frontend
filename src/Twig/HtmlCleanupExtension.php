<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Twig;

use Twig\Extension\AbstractExtension;
use Twig\TwigFilter;

class HtmlCleanupExtension extends AbstractExtension
{
    public function getFilters(): array
    {
        return [
            new TwigFilter('unescape_header', [$this, 'unescapeHeader']),
        ];
    }

    public function unescapeHeader(?string $content): string
    {
        if ($content === null) {
            return '';
        }

        return stripslashes($content);
    }
}
