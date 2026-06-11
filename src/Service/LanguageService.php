<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Service;

use PhpList\Core\Core\ApplicationStructure;

class LanguageService
{
    private const DEFAULT_LANGUAGE_FILE = 'english.inc';
    private const LANGUAGE_FILE_PATH = '/public/lists/texts';

    /**
     * @return array<string, string>
     */
    public function loadLanguageTexts(?string $languageFile): array
    {
        $applicationRoot = (new ApplicationStructure())->getApplicationRoot();
        $languageDir = $applicationRoot . self::LANGUAGE_FILE_PATH;

        if (!is_dir($languageDir)) {
            return [];
        }

        $selectedFile = $this->sanitizeLanguageFile($languageFile) ?? self::DEFAULT_LANGUAGE_FILE;
        $languagePath = $languageDir . '/' . $selectedFile;

        if (!is_file($languagePath)) {
            $languagePath = $languageDir . '/' . self::DEFAULT_LANGUAGE_FILE;
        }

        if (!is_file($languagePath)) {
            return [];
        }

        $loader = static function (string $path): array {
            require $path;

            return array_map(function ($value) {
                return $value;
            }, get_defined_vars());
        };

        return $loader($languagePath);
    }

    private function sanitizeLanguageFile(?string $languageFile): ?string
    {
        if (!is_string($languageFile) || $languageFile === '') {
            return null;
        }

        $languageFile = basename($languageFile);

        if (!preg_match('/^[A-Za-z0-9._-]+\.inc$/', $languageFile)) {
            return null;
        }

        return $languageFile;
    }
}
