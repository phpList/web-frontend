<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use Exception;
use GuzzleHttp\Exception\GuzzleException;
use PhpList\RestApiClient\Client;
use PhpList\RestApiClient\Endpoint\AuthClient;
use PhpList\RestApiClient\Exception\ApiException;
use PhpList\RestApiClient\Exception\AuthenticationException;
use PhpList\WebFrontend\Service\AuthenticationService;
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
        private readonly AuthClient $authClient,
        private readonly Client $apiClient,
        private readonly AuthenticationService $authenticationService,
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

        $error = $this->authenticationService->consumeLoginError($request);
        $success = $request->get('reset') === 'success'
            ? 'Your password has been reset successfully. Please sign in.'
            : null;

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
                $this->authenticationService->storeAuthentication($request, $authData);

                return $this->redirectAfterLogin($redirectTarget);
            } catch (GuzzleException $e) {
                $error = 'Invalid credentials or server error: ' . $e->getMessage();
            } catch (Exception $e) {
                $error = $e->getCode() === 401 ? 'Invalid credentials: ' . $e->getMessage() : $e->getMessage();
            }
        }

        return $this->render('@PhpListFrontend/auth/login.html.twig', [
            'error' => $error,
            'success' => $success,
            'redirect' => $redirectTarget,
        ]);
    }

    #[Route('/forgot-password', name: 'forgot_password', methods: ['GET', 'POST'])]
    public function forgotPassword(Request $request): Response
    {
        if ($request->getSession()->has('auth_token')) {
            return $this->redirectToRoute('home');
        }

        $error = null;
        $success = null;

        if ($request->isMethod('POST')) {
            $email = trim((string) $request->request->get('email', ''));

            if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $error = 'Please enter a valid email address.';
            } else {
                try {
                    $this->apiClient->post('password-reset/request', ['email' => $email]);
                } catch (ApiException $e) {
                    $this->logger->error('Password reset request failed: ' . $e->getMessage());
                }

                // Always show the same message, whether or not the email is registered,
                // so this endpoint can't be used to enumerate administrator accounts.
                $success = 'If an account exists for that email address, '
                    . 'a password reset link has been sent to it.';
            }
        }

        return $this->render('@PhpListFrontend/auth/forgot_password.html.twig', [
            'error' => $error,
            'success' => $success,
        ]);
    }

    #[Route('/reset-password', name: 'reset_password', methods: ['GET', 'POST'])]
    public function resetPassword(Request $request): Response
    {
        if ($request->getSession()->has('auth_token')) {
            return $this->redirectToRoute('home');
        }

        $invalidTokenError = 'This password reset link is invalid or has expired. Please request a new one.';

        if ($request->isMethod('POST')) {
            $token = (string) $request->request->get('token', '');
            $newPassword = (string) $request->request->get('newPassword', '');
            $confirmPassword = (string) $request->request->get('confirmPassword', '');

            $error = $this->authenticationService->validateNewPassword($token, $newPassword, $confirmPassword);

            if ($error === null) {
                try {
                    $this->apiClient->post('password-reset/reset', [
                        'token' => $token,
                        'newPassword' => $newPassword,
                    ]);

                    return $this->redirectToRoute('login', ['reset' => 'success']);
                } catch (ApiException $e) {
                    $error = $invalidTokenError;
                }
            }

            return $this->render('@PhpListFrontend/auth/reset_password.html.twig', [
                'error' => $error,
                'token' => $token,
            ]);
        }

        $token = (string) $request->get('token', '');
        if ($token === '' || !$this->authenticationService->isPasswordResetTokenValid($token)) {
            return $this->render('@PhpListFrontend/auth/reset_password.html.twig', [
                'error' => $invalidTokenError,
                'token' => null,
            ]);
        }

        return $this->render('@PhpListFrontend/auth/reset_password.html.twig', [
            'error' => null,
            'token' => $token,
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
    public function about(Request $request): JsonResponse
    {
        // ApiSessionListener sets this on the shared Client for every request, but on
        // concurrent XHR requests sharing one PHP session it can race - re-set it here from
        // this request's own session so getSessionUser() never fails purely on a timing gap.
        $authToken = $request->getSession()->get('auth_token');
        if ($authToken) {
            $this->apiClient->setSessionId((string) $authToken);
        }

        try {
            $user = $this->authClient->getSessionUser();
        } catch (AuthenticationException) {
            return new JsonResponse(
                ['error' => 'Unable to load current user.'],
                401
            );
        } catch (ApiException $e) {
            $this->logger->error('Unable to load current user: ' . $e->getMessage());

            return new JsonResponse(
                ['error' => 'Unable to load current user.'],
                Response::HTTP_BAD_GATEWAY
            );
        }


        $userData = $user->toArray();

        // The Administrator response entity used by getSessionUser() doesn't parse
        // privileges, so fetch the raw administrator record to expose them to the frontend.
        // Note: the session's "auth_id" is actually the session ID returned by the login
        // endpoint (see Client::login()), not the administrator ID - use the admin's own
        // id from getSessionUser() instead.
        $adminId = $userData['id'] ?? null;
        if ($adminId !== null) {
            try {
                $administrator = $this->apiClient->get('administrators/' . $adminId);
                $userData['privileges'] = $administrator['privileges'] ?? [];
            } catch (ApiException $e) {
                $this->logger->error('Unable to load administrator privileges: ' . $e->getMessage());
            }
        }

        return new JsonResponse($userData);
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
