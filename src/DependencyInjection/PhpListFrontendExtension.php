<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\DependencyInjection;

use Exception;
use InvalidArgumentException;
use Symfony\Component\Config\FileLocator;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Extension\PrependExtensionInterface;
use Symfony\Component\DependencyInjection\Loader\YamlFileLoader;
use Symfony\Component\HttpKernel\DependencyInjection\Extension;

class PhpListFrontendExtension extends Extension implements PrependExtensionInterface
{
    private const TWIG_NAMESPACE = 'PhpListFrontend';
    private const ASSET_PACKAGE_NAME = 'phplist_web_frontend';

    /**
     * Loads a specific configuration.
     *
     * @param array $configs configuration values
     * @param ContainerBuilder $container
     *
     * @return void
     *
     * @throws InvalidArgumentException|Exception if the provided tag is not defined in this extension
     */
    public function load(array $configs, ContainerBuilder $container): void
    {
        // @phpstan-ignore-next-line
        $configs;
        $loader = new YamlFileLoader($container, new FileLocator($this->getBundlePath() . '/config'));
        $loader->load('services.yml');
    }

    public function prepend(ContainerBuilder $container): void
    {
        $bundlePath = $this->getBundlePath();

        $container->prependExtensionConfig('twig', [
            'paths' => [
                $bundlePath . '/templates' => self::TWIG_NAMESPACE,
            ],
        ]);

        $container->prependExtensionConfig('framework', [
            'assets' => [
                'packages' => [
                    self::ASSET_PACKAGE_NAME => [
                        'base_path' => '/',
                    ],
                ],
            ],
        ]);
    }

    private function getBundlePath(): string
    {
        return dirname(__DIR__, 2);
    }
}
