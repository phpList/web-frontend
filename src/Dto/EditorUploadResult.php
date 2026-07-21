<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Dto;

final class EditorUploadResult
{
    public function __construct(
        public readonly string $fileName,
        public readonly string $relativeUrl,
    ) {
    }
}
