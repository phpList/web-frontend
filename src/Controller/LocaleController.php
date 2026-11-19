<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use PhpList\WebFrontend\Service\LocalePreference;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class LocaleController extends AbstractController
{
    public function __construct(private readonly LocalePreference $preference)
    {
    }

    /**
     * Records the language picked in the header selector for the logged-in administrator
     * (and as the browser's most recent one, which the login page uses).
     */
    #[Route('/locale', name: 'set_locale', methods: ['POST'])]
    public function set(Request $request): Response
    {
        // Requiring JSON keeps this out of reach of cross-site form posts.
        if ($request->getContentTypeFormat() !== 'json') {
            return new JsonResponse(['error' => 'Expected a JSON body'], Response::HTTP_UNSUPPORTED_MEDIA_TYPE);
        }

        $data = json_decode($request->getContent(), true);
        $locale = is_array($data) ? ($data['locale'] ?? null) : null;
        if (!is_string($locale) || !$this->preference->isSupported($locale)) {
            return new JsonResponse(['error' => 'Unsupported locale'], Response::HTTP_BAD_REQUEST);
        }

        $response = new Response(null, Response::HTTP_NO_CONTENT);
        foreach ($this->preference->createChoiceCookies($request, $locale) as $cookie) {
            $response->headers->setCookie($cookie);
        }

        return $response;
    }
}
