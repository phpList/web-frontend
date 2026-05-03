<?php

declare(strict_types=1);

namespace PhpList\WebFrontend;

use PhpList\WebFrontend\DependencyInjection\Compiler\RegisterEndpointsPass;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\HttpKernel\Bundle\Bundle;

class PhpListFrontendBundle extends Bundle
{
    public function build(ContainerBuilder $container): void
    {
        parent::build($container);

        $container->addCompilerPass(new RegisterEndpointsPass());
    }
}
