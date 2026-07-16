<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\EventSubscriber;

use Exception;
use PhpList\RestApiClient\Exception\ApiException;
use PhpList\RestApiClient\Exception\ValidationException;
use PhpList\WebFrontend\EventSubscriber\ApiExceptionSubscriber;
use Symfony\Component\HttpFoundation\Response;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\HttpKernelInterface;
use Symfony\Component\HttpKernel\KernelEvents;

class ApiExceptionSubscriberTest extends TestCase
{
    private ApiExceptionSubscriber $subscriber;

    protected function setUp(): void
    {
        $this->subscriber = new ApiExceptionSubscriber();
    }

    public function testGetSubscribedEvents(): void
    {
        $events = ApiExceptionSubscriber::getSubscribedEvents();

        $this->assertArrayHasKey(KernelEvents::EXCEPTION, $events);
        $this->assertEquals('onKernelException', $events[KernelEvents::EXCEPTION]);
    }

    public function testOnKernelExceptionWithOtherException(): void
    {
        $exception = new Exception('Some other error');

        $request = $this->createMock(Request::class);

        $kernel = $this->createMock(HttpKernelInterface::class);
        $event = new ExceptionEvent(
            $kernel,
            $request,
            HttpKernelInterface::MAIN_REQUEST,
            $exception
        );

        $this->subscriber->onKernelException($event);

        $this->assertNull($event->getResponse());
    }

    public function testOnKernelExceptionMapsUpstreamApiFailureToBadGateway(): void
    {
        $apiException = new ApiException('API request failed', 500);

        $request = $this->createMock(Request::class);
        $request->method('isXmlHttpRequest')->willReturn(false);

        $kernel = $this->createMock(HttpKernelInterface::class);
        $event = new ExceptionEvent(
            $kernel,
            $request,
            HttpKernelInterface::MAIN_REQUEST,
            $apiException
        );

        $this->subscriber->onKernelException($event);

        $response = $event->getResponse();
        $this->assertInstanceOf(Response::class, $response);
        $this->assertEquals(Response::HTTP_BAD_GATEWAY, $response->getStatusCode());
    }

    public function testOnKernelExceptionMapsUpstreamApiFailureToBadGatewayForXhr(): void
    {
        // statusCode 0 models a transport failure (connection refused / timeout).
        $apiException = new ApiException('API request failed', 0);

        $request = $this->createMock(Request::class);
        $request->method('isXmlHttpRequest')->willReturn(true);

        $kernel = $this->createMock(HttpKernelInterface::class);
        $event = new ExceptionEvent(
            $kernel,
            $request,
            HttpKernelInterface::MAIN_REQUEST,
            $apiException
        );

        $this->subscriber->onKernelException($event);

        $response = $event->getResponse();
        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertEquals(Response::HTTP_BAD_GATEWAY, $response->getStatusCode());

        $data = json_decode($response->getContent(), true);
        $this->assertEquals('upstream_unavailable', $data['error']);
    }

    public function testOnKernelExceptionLeavesClientShapedApiExceptionUntouched(): void
    {
        // A ValidationException (400/422) extends ApiException but is a genuine client error;
        // it must not be converted to a 502.
        $validationException = new ValidationException('Validation failed', 422);

        $request = $this->createMock(Request::class);
        $request->method('isXmlHttpRequest')->willReturn(false);

        $kernel = $this->createMock(HttpKernelInterface::class);
        $event = new ExceptionEvent(
            $kernel,
            $request,
            HttpKernelInterface::MAIN_REQUEST,
            $validationException
        );

        $this->subscriber->onKernelException($event);

        $this->assertNull($event->getResponse());
    }
}
