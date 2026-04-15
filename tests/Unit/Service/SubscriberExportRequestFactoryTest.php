<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\Service;

use PhpList\RestApiClient\Request\Subscriber\ExportSubscriberRequest;
use PhpList\WebFrontend\Service\SubscriberExportRequestFactory;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\ParameterBag;

class SubscriberExportRequestFactoryTest extends TestCase
{
    private SubscriberExportRequestFactory $factory;

    protected function setUp(): void
    {
        $this->factory = new SubscriberExportRequestFactory();
    }

    public function testFromQueryWithDefaultValues(): void
    {
        $query = new ParameterBag([]);
        $request = $this->factory->fromQuery($query);

        $this->assertInstanceOf(ExportSubscriberRequest::class, $request);
        $this->assertEquals('any', $request->dateType);
        $this->assertNull($request->listId);
        $this->assertNull($request->dateFrom);
        $this->assertNull($request->dateTo);
        $this->assertEquals([], $request->columns);
        $this->assertNull($request->isConfirmed);
        $this->assertNull($request->isBlacklisted);
    }

    public function testFromQueryWithAllParameters(): void
    {
        $query = new ParameterBag([
            'date_type' => 'created',
            'list_id' => '42',
            'date_from' => '2023-01-01',
            'date_to' => '2023-12-31',
            'columns' => ['email', 'confirmed', ''],
            'confirmed' => '1',
            'blacklisted' => '1',
        ]);
        $request = $this->factory->fromQuery($query);

        $this->assertEquals('created', $request->dateType);
        $this->assertEquals(42, $request->listId);
        $this->assertEquals('2023-01-01', $request->dateFrom);
        $this->assertEquals('2023-12-31', $request->dateTo);
        $this->assertEquals(['email', 'confirmed'], $request->columns);
        $this->assertTrue($request->isConfirmed);
        $this->assertTrue($request->isBlacklisted);
    }

    public function testFromQueryWithUnconfirmedAndNonBlacklisted(): void
    {
        $query = new ParameterBag([
            'unconfirmed' => '1',
            'non-blacklisted' => '1',
        ]);
        $request = $this->factory->fromQuery($query);

        $this->assertFalse($request->isConfirmed);
        $this->assertFalse($request->isBlacklisted);
    }

    public function testFromQueryConfirmedPriority(): void
    {
        // When both confirmed and unconfirmed are present, confirmed takes precedence
        $query = new ParameterBag([
            'confirmed' => '1',
            'unconfirmed' => '1',
        ]);
        $request = $this->factory->fromQuery($query);

        $this->assertTrue($request->isConfirmed);
    }

    public function testFromQueryBlacklistedPriority(): void
    {
        // When both blacklisted and non-blacklisted are present, blacklisted takes precedence
        $query = new ParameterBag([
            'blacklisted' => '1',
            'non-blacklisted' => '1',
        ]);
        $request = $this->factory->fromQuery($query);

        $this->assertTrue($request->isBlacklisted);
    }
}
