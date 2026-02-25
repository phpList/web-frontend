<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Attribute;

use Attribute;

#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD)]
class PublicRoute
{
    public function __construct(public bool $isPublic = true)
    {
    }
}
