<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use PhpList\WebFrontend\Twig\TranslationsExtension;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Serves the admin UI strings to the Vue app. The language is chosen client-side
 * (stored in localStorage), so the app asks for the catalogue of that language.
 */
class TranslationsController extends AbstractController
{
    public function __construct(private readonly TranslationsExtension $translations)
    {
    }

    #[Route(
        '/translations/{locale}.json',
        name: 'translations',
        requirements: ['locale' => '[A-Za-z_]+'],
        methods: ['GET'],
    )]
    public function messages(Request $request, string $locale): Response
    {
        if (!in_array($locale, $this->translations->getSupportedLocales(), true)) {
            return $this->json(['error' => 'Unsupported locale'], Response::HTTP_NOT_FOUND);
        }

        $response = new JsonResponse((object) $this->translations->getMessages($locale));
        $response->setEncodingOptions(JsonResponse::DEFAULT_ENCODING_OPTIONS | JSON_UNESCAPED_UNICODE);
        $response->setPrivate();
        $response->headers->addCacheControlDirective('must-revalidate');
        $response->setEtag(md5((string) $response->getContent()));
        $response->isNotModified($request);

        return $response;
    }
}
