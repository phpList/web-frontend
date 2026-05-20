<?php

namespace PhpList\WebFrontend\Service;

use Symfony\Component\Translation\Loader\LoaderInterface;
use Symfony\Component\Translation\MessageCatalogue;

class PhpListTranslationLoader implements LoaderInterface
{
    private string $publicDir;

    public function __construct(string $projectDir)
    {
        // Target the compatible public path
        $this->publicDir = $projectDir . '/public/lists/texts/';
    }

    public function load(mixed $resource, string $locale, string $domain = 'messages'): MessageCatalogue
    {
        $catalogue = new MessageCatalogue($locale);

        // Map Symfony locales (e.g., 'en') to phpList filenames (e.g., 'english.php')
        $fileName = $this->mapLocaleToPhpListFile($locale);
        $filePath = $this->publicDir . $fileName;

        if (!file_exists($filePath)) {
            return $catalogue;
        }

        // Isolate scope and include the raw file to capture phpList variables
        $phpListTranslations = $this->extractVariables($filePath);

        $catalogue->add($phpListTranslations, $domain);

        return $catalogue;
    }

    private function extractVariables(string $filePath): array
    {
        // Include the file inside an isolated closure
        $getVars = function ($file) {
            include $file;
            return get_defined_vars();
        };

        $allVars = $getVars($filePath);
        $flattened = [];

        foreach ($allVars as $key => $value) {
            // Filter out internal closure parameters
            if ($key === 'file') {
                continue;
            };

            // phpList3 handles both $strVariable and $lan['variable'] arrays
            if ($key === 'lan' && is_array($value)) {
                foreach ($value as $subKey => $subValue) {
                    $flattened['lan.' . $subKey] = $subValue;
                }
            } elseif (is_string($value)) {
                $flattened[$key] = $value;
            }
        }

        return $flattened;
    }

    private function mapLocaleToPhpListFile(string $locale): string
    {
        $map = [
            'en' => 'english.php',
            'es' => 'spanish.php',
            'fr' => 'french.php',
        ];

        return $map[$locale] ?? 'english.php';
    }
}

// USAGE
// If the file contains $strPleaseEnter
//    <label>{{ 'strPleaseEnter'|trans }}</label>
//
// If the file contains $lan['money']
//    <p>{{ 'lan.money'|trans }}</p>
