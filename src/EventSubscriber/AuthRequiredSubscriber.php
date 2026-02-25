<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\EventSubscriber;

use PhpList\WebFrontend\Attribute\PublicRoute;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpKernel\Event\ControllerEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use ReflectionClass;
use ReflectionMethod;

class AuthRequiredSubscriber implements EventSubscriberInterface
{
    public function __construct(private readonly UrlGeneratorInterface $urlGenerator)
    {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::CONTROLLER => 'onController',
        ];
    }

    public function onController(ControllerEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $controller = $event->getController();
        if (!\is_array($controller)) {
            return;
        }

        [$controllerObject, $methodName] = $controller;

        if ($this->isPublicRoute($controllerObject, $methodName)) {
            return;
        }

        $request = $event->getRequest();
        $session = $request->getSession();

        if (!$session->has('auth_token')) {
            $loginUrl = $this->urlGenerator->generate('login');
            $event->setController(static fn () => new RedirectResponse($loginUrl));
        }
    }

    private function isPublicRoute(object $controllerObject, string $methodName): bool
    {
        $rc = new ReflectionClass($controllerObject);

        if ($rc->hasMethod($methodName)) {
            $rm = new ReflectionMethod($controllerObject, $methodName);
            foreach ($rm->getAttributes(PublicRoute::class) as $attr) {
                /** @var PublicRoute $instance */
                $instance = $attr->newInstance();
                if ($instance->isPublic) {
                    return true;
                }
            }
        }

        foreach ($rc->getAttributes(PublicRoute::class) as $attr) {
            /** @var PublicRoute $instance */
            $instance = $attr->newInstance();
            if ($instance->isPublic) {
                return true;
            }
        }

        return false;
    }
}
