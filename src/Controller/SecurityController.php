<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use Exception;
use GuzzleHttp\Exception\GuzzleException;
use PhpList\WebFrontend\Service\ApiClient;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Session\SessionInterface;
use Symfony\Component\Routing\Attribute\Route;

class SecurityController extends AbstractController
{
    private ApiClient $apiClient;
    private SessionInterface $session;

    public function __construct(ApiClient $apiClient, RequestStack $requestStack)
    {
        $this->apiClient = $apiClient;
        $this->session = $requestStack->getSession();
    }

    #[Route('', name: 'login', methods: ['GET', 'POST'])]
    public function login(Request $request): Response
    {
        if ($this->session->has('auth_token')) {
            return $this->redirectToRoute('dashboard');
        }

        $error = null;

        if ($request->isMethod('POST')) {
            $username = $request->request->get('username');
            $password = $request->request->get('password');

            try {
                $authData = $this->apiClient->authenticate($username, $password);

                // Store token in session
                $this->session->set('auth_token', $authData['token']);

                // Store user data if needed
                if (isset($authData['user'])) {
                    $this->session->set('user', $authData['user']);
                }

                // Set token for future API requests
                $this->apiClient->setAuthToken($authData['token']);

                // Redirect to dashboard
                return $this->redirectToRoute('dashboard');
            } catch (Exception $e) {
                $error = 'Invalid credentials or server error: ' . $e->getMessage();
            } catch (GuzzleException $e) {
                $error = 'Invalid credentials or server error: ' . $e->getMessage();
            }
        }

        return $this->render('security/login.html.twig', [
            'error' => $error,
        ]);
    }

    #[Route('/logout', name: 'logout')]
    public function logout(): Response
    {
        // Clear session data
        $this->session->remove('auth_token');
        $this->session->remove('user');

        return $this->redirectToRoute('login');
    }
}
