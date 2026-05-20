<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/_internal', name: 'internal_')]
class InternalController extends AbstractController
{
    #[Route('/languages', name: 'languages', methods: ['GET'])]
    public function languages(Request $request): JsonResponse
    {
        $projectDir = $this->getParameter('kernel.project_dir');
        $langDir = $projectDir . '/vendor/phplist/phplist-lan-texts';

        $files = [];
        if (is_dir($langDir)) {
            $dirItems = scandir($langDir);
            if (is_array($dirItems)) {
                foreach ($dirItems as $item) {
                    if (is_file($langDir . '/' . $item) && preg_match('/\.inc$/i', $item)) {
                        $files[] = $item;
                    }
                }
            }
        }

        sort($files, SORT_STRING);

        return $this->json($files);
    }
}
