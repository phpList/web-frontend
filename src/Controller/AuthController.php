<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use Exception;
use GuzzleHttp\Exception\GuzzleException;
use PhpList\WebFrontend\Service\ApiClient;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class AuthController extends AbstractController
{
    private ApiClient $apiClient;

    public function __construct(ApiClient $apiClient)
    {
        $this->apiClient = $apiClient;
    }

    #[Route('/login', name: 'login', methods: ['GET', 'POST'])]
    public function login(Request $request): Response
    {
        if ($request->getSession()->has('auth_token')) {
            return $this->redirectToRoute('empty_start_page');
        }

        $error = null;
        $session = $request->getSession();
        if ($session->has('login_error')) {
            $error = $session->get('login_error');
            $session->remove('login_error');
        }

        if ($request->isMethod('POST')) {
            $username = $request->request->get('username');
            $password = $request->request->get('password');

            try {
                $authData = $this->apiClient->authenticate($username, $password);
                $request->getSession()->set('auth_token', $authData['key']);
                $request->getSession()->set('auth_expiry_date', $authData['key']);
                $this->apiClient->setAuthToken($authData['key']);

                return $this->redirectToRoute('empty_start_page');
            } catch (Exception $e) {
                $error = 'Invalid credentials or server error: ' . $e->getMessage();
            } catch (GuzzleException $e) {
                $error = 'Invalid credentials or server error: ' . $e->getMessage();
            }
        }

        return $this->render('auth/login.html.twig', [
            'error' => $error,
        ]);
    }

    #[Route('/logout', name: 'logout')]
    public function logout(Request $request): Response
    {
        $request->getSession()->remove('auth_token');

        return $this->redirectToRoute('login');
    }
}
