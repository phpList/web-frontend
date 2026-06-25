<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use Exception;
use GuzzleHttp\Exception\GuzzleException;
use PhpList\RestApiClient\Endpoint\AuthClient;
use PhpList\WebFrontend\Trait\RedirectValidationTrait;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class AuthController extends AbstractController
{
    use RedirectValidationTrait;

    public function __construct(
        private readonly AuthClient      $authClient,
        private readonly LoggerInterface $logger
    ) {
    }

    #[Route('/login', name: 'login', methods: ['GET', 'POST'])]
    public function login(Request $request): Response
    {
        $redirectTarget = $this->resolveRedirectTarget($request);

        if ($request->getSession()->has('auth_token')) {
            return $this->redirectAfterLogin($redirectTarget);
        }

        $error = null;
        $session = $request->getSession();
        if ($session->has('login_error')) {
            $error = $session->get('login_error');
            $session->remove('login_error');
        }

        if ($request->isMethod('POST')) {
            $username = trim((string) $request->request->get('username', ''));
            $password = (string) $request->request->get('password', '');

            if ($username === '' || $password === '') {
                return $this->render('@PhpListFrontend/auth/login.html.twig', [
                    'error' => 'Username and password are required.',
                    'redirect' => $redirectTarget,
                ]);
            }

            try {
                $authData = $this->authClient->login($username, $password);
                $request->getSession()->set('auth_token', $authData['key']);
                $request->getSession()->set('auth_expiry_date', $authData['expiry_date']);
                $request->getSession()->set('auth_id', (int) $authData['id']);
                $request->getSession()->save();

                return $this->redirectAfterLogin($redirectTarget);
            } catch (Exception $e) {
                $error = $e->getCode() === 401 ? 'Invalid credentials: ' . $e->getMessage() : $e->getMessage();
            } catch (GuzzleException $e) {
                $error = 'Invalid credentials or server error: ' . $e->getMessage();
            }
        }

        return $this->render('@PhpListFrontend/auth/login.html.twig', [
            'error' => $error,
            'redirect' => $redirectTarget,
        ]);
    }

    #[Route('/logout', name: 'logout')]
    public function logout(Request $request): Response
    {
        $request->getSession()->remove('auth_token');
        $request->getSession()->remove('auth_id');
        $this->authClient->logout();

        return $this->redirectToRoute('login');
    }

    #[Route('/admin-about', name: 'admin_about')]
    public function about(): JsonResponse
    {
        try {
            $user = $this->authClient->getSessionUser();
        } catch (Exception | GuzzleException $e) {
            $this->logger->error('Unable to load current user: ' . $e->getMessage());

            return new JsonResponse(
                ['error' => 'Unable to load current user.'],
                Response::HTTP_SERVICE_UNAVAILABLE
            );
        }

        return new JsonResponse($user->toArray());
    }

    private function redirectAfterLogin(?string $redirectTarget): Response
    {
        if ($redirectTarget !== null) {
            return $this->redirect($redirectTarget);
        }

        return $this->redirectToRoute('home');
    }

    private function resolveRedirectTarget(Request $request): ?string
    {
        $redirectTarget = $request->get('redirect');
        if (!is_string($redirectTarget)) {
            return null;
        }

        $redirectTarget = trim($redirectTarget);
        if ($redirectTarget === '') {
            return null;
        }

        return $this->isSafeRedirectTarget($redirectTarget) ? $redirectTarget : null;
    }
}
