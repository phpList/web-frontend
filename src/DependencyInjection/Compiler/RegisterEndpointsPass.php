<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\DependencyInjection\Compiler;

use ReflectionException;
use ReflectionClass;
use Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;

class RegisterEndpointsPass implements CompilerPassInterface
{
    /**
     * @SuppressWarnings("CyclomaticComplexity")
     * @SuppressWarnings("NPathComplexity")
     */
    public function process(ContainerBuilder $container): void
    {
        $projectDir = $container->hasParameter('kernel.application_dir')
            ? $container->getParameter('kernel.application_dir')
            : $container->getParameter('kernel.project_dir');

        if (! is_string($projectDir)) {
            return;
        }

        $endpointDirectory = rtrim($projectDir, '/') . '/vendor/tatevikgr/rest-api-client/src/Endpoint';
        if (! is_dir($endpointDirectory)) {
            return;
        }

        $endpointFiles = glob($endpointDirectory . '/*.php') ?: [];

        foreach ($endpointFiles as $endpointFile) {
            $className = 'PhpList\\RestApiClient\\Endpoint\\' . basename($endpointFile, '.php');

            if ($container->hasDefinition($className) || $container->hasAlias($className)) {
                continue;
            }

            try {
                if (! class_exists($className)) {
                    continue;
                }

                $reflection = new ReflectionClass($className);
                if (! $reflection->isInstantiable()) {
                    continue;
                }
            } catch (ReflectionException) {
                continue;
            }

            $container
                ->autowire($className, $className)
                ->setAutowired(true)
                ->setAutoconfigured(true)
                ->setPublic(false);
        }
    }
}
