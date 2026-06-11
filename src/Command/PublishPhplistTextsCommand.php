<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Command;

use Composer\InstalledVersions;
use Exception;
use PhpList\Core\Core\ApplicationStructure;
use RuntimeException;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\Filesystem\Filesystem;

#[AsCommand(
    name: 'web-frontend:publish-phplist-texts',
    description: 'Publishes phpList language texts from vendor to public directory.',
)]
class PublishPhplistTextsCommand extends Command
{
    private string $projectDir;
    private Filesystem $filesystem;

    public function __construct(string $projectDir)
    {
        parent::__construct();
        $this->projectDir = $projectDir;
        $this->filesystem = new Filesystem();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $sourceDir = $this->resolveTextsSourceDir();
        $targetDir = $this->resolveTargetDir();

        if ($sourceDir === null || !$this->filesystem->exists($sourceDir)) {
            $io->error('The phplist-lan-texts package is not installed in the vendor directory.');
            return Command::FAILURE;
        }

        try {
            // Ensure the target directory exists and is clean
            if ($this->filesystem->exists($targetDir)) {
                $this->filesystem->remove($targetDir);
            }
            $this->filesystem->mkdir($targetDir);

            // Copy all .inc files from vendor to public directory
            foreach (glob($sourceDir . '/*.inc') as $file) {
                $filename = basename($file);
                $this->filesystem->copy($file, $targetDir . '/' . $filename, true);
            }

            $io->success('phpList translation files successfully published to public/lists/texts/');
            return Command::SUCCESS;
        } catch (Exception $e) {
            $io->error('An error occurred while copying files: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }

    private function resolveTextsSourceDir(): ?string
    {
        if (class_exists(InstalledVersions::class) && InstalledVersions::isInstalled('phplist/phplist-lan-texts')) {
            $installPath = InstalledVersions::getInstallPath('phplist/phplist-lan-texts');
            if (is_string($installPath) && $installPath !== '') {
                return $installPath;
            }
        }

        $applicationRoot = $this->resolveApplicationRoot();
        $candidates = [
            $applicationRoot . '/vendor/phplist/phplist-lan-texts',
            $this->projectDir . '/vendor/phplist/phplist-lan-texts',
        ];

        foreach ($candidates as $candidate) {
            if ($this->filesystem->exists($candidate)) {
                return $candidate;
            }
        }

        return null;
    }

    private function resolveTargetDir(): string
    {
        return $this->resolveApplicationRoot() . '/public/lists/texts';
    }

    private function resolveApplicationRoot(): string
    {
        try {
            return (new ApplicationStructure())->getApplicationRoot();
        } catch (RuntimeException) {
            return $this->projectDir;
        }
    }
}
