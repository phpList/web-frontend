<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Dto;

final class EditorAssetItem
{
    public function __construct(
        public readonly string $fileName,
        public readonly string $url,
        public readonly string $mimeType,
        public readonly int $size,
        public readonly int $modifiedAt,
        public readonly bool $isImage,
    ) {
    }

    public function toArray(): array
    {
        return [
            'fileName' => $this->fileName,
            'url' => $this->url,
            'mimeType' => $this->mimeType,
            'size' => $this->size,
            'modifiedAt' => $this->modifiedAt,
            'isImage' => $this->isImage,
        ];
    }
}
