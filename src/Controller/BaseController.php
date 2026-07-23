<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use PhpList\RestApiClient\Endpoint\AuthClient;
use PhpList\RestApiClient\Entity\Administrator;
use PhpList\RestApiClient\Exception\ApiException;
use PhpList\RestApiClient\Exception\AuthenticationException;
use PhpList\RestApiClient\Exception\AuthorizationException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

class BaseController extends AbstractController
{
    public function __construct(
        protected AuthClient $authClient,
    ) {
    }

    protected function getAdmin(): ?Administrator
    {
        try {
            $admin = $this->authClient->getSessionUser();
        } catch (ApiException | AuthenticationException | AuthorizationException) {
            // Best-effort context: knowing whether an admin is viewing is optional, so any
            // failure (including an upstream ApiException) degrades to "anonymous visitor"
            // rather than breaking public pages. Callers that need the API result to succeed
            // must not rely on this method.
            $admin = null;
        }

        return $admin;
    }
}
