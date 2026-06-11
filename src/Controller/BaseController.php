<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use PhpList\RestApiClient\Endpoint\AuthClient;
use PhpList\RestApiClient\Entity\Administrator;
use PhpList\RestApiClient\Exception\ApiException;
use PhpList\RestApiClient\Exception\AuthenticationException;
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
        } catch (ApiException | AuthenticationException) {
            $admin = null;
        }

        return $admin;
    }
}
