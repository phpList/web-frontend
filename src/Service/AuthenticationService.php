<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Service;

use PhpList\RestApiClient\Client;
use PhpList\RestApiClient\Exception\ApiException;
use Symfony\Component\HttpFoundation\Request;

class AuthenticationService
{
    public function __construct(private readonly Client $apiClient)
    {
    }

    public function storeAuthentication(Request $request, array $authData): void
    {
        $session = $request->getSession();

        $session->set('auth_token', $authData['key']);
        $session->set('auth_expiry_date', $authData['expiry_date']);
        $session->set('auth_id', (int) $authData['id']);

        $session->save();
    }

    public function consumeLoginError(Request $request): ?string
    {
        $session = $request->getSession();

        if (!$session->has('login_error')) {
            return null;
        }

        $error = $session->get('login_error');
        $session->remove('login_error');

        return $error;
    }

    public function validateNewPassword(string $token, string $newPassword, string $confirmPassword): ?string
    {
        if ($token === '') {
            return 'This password reset link is invalid or has expired. Please request a new one.';
        }

        if ($newPassword === '' || $confirmPassword === '') {
            return 'Please fill in both password fields.';
        }

        if ($newPassword !== $confirmPassword) {
            return 'Passwords do not match.';
        }

        if (strlen($newPassword) < 8) {
            return 'Password must be at least 8 characters long.';
        }

        return null;
    }

    public function isPasswordResetTokenValid(string $token): bool
    {
        try {
            $result = $this->apiClient->post('password-reset/validate', ['token' => $token]);
        } catch (ApiException $e) {
            return false;
        }

        return ($result['valid'] ?? false) === true;
    }
}
