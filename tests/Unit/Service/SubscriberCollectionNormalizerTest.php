<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\Service;

use PhpList\RestApiClient\Entity\Subscriber;
use PhpList\RestApiClient\Response\CursorPagination;
use PhpList\RestApiClient\Response\Subscribers\SubscriberCollection;
use PhpList\WebFrontend\Service\SubscriberCollectionNormalizer;
use PHPUnit\Framework\TestCase;

class SubscriberCollectionNormalizerTest extends TestCase
{
    private SubscriberCollectionNormalizer $normalizer;

    protected function setUp(): void
    {
        $this->normalizer = new SubscriberCollectionNormalizer();
    }

    public function testNormalizeWithItems(): void
    {
        $subscriber = new Subscriber([]);
        $subscriber->id = 1;
        $subscriber->email = 'test@example.com';
        $subscriber->confirmed = true;
        $subscriber->blacklisted = false;
        $subscriber->createdAt = '2023-01-01 12:00:00';
        $subscriber->uniqueId = 'uid-123';
        $subscriber->subscribedLists = ['list1', 'list2'];

        $collection = new SubscriberCollection([
            'items' => [],
            'pagination' => [
                'limit' => 10,
                'next_cursor' => 100,
                'has_more' => true,
                'total' => 50,
            ],
        ]);
        $collection->items = [$subscriber];

        $result = $this->normalizer->normalize($collection, 0, 50);

        $this->assertArrayHasKey('items', $result);
        $this->assertCount(1, $result['items']);
        $this->assertEquals([
            'id' => 1,
            'email' => 'test@example.com',
            'confirmed' => true,
            'blacklisted' => false,
            'createdAt' => '2023-01-01 12:00:00',
            'uniqueId' => 'uid-123',
            'listCount' => 2,
        ], $result['items'][0]);

        $this->assertArrayHasKey('pagination', $result);
        $this->assertEquals([
            'limit' => 10,
            'afterId' => 100,
            'hasMore' => true,
            'total' => 50,
            'prevId' => 0,
            'isFirstPage' => false,
        ], $result['pagination']);
    }

    public function testNormalizeEmptyCollection(): void
    {
        $collection = new SubscriberCollection([
            'items' => [],
            'pagination' => [
                'limit' => 20,
                'next_cursor' => null,
                'has_more' => false,
                'total' => 0,
            ],
        ]);

        $result = $this->normalizer->normalize($collection, null, null);

        $this->assertArrayHasKey('items', $result);
        $this->assertEmpty($result['items']);
        $this->assertArrayHasKey('pagination', $result);
        $this->assertTrue($result['pagination']['isFirstPage']);
        $this->assertNull($result['pagination']['prevId']);
        $this->assertNull($result['pagination']['afterId']);
    }

    public function testNormalizeNullItems(): void
    {
        $collection = new SubscriberCollection([
            'items' => [],
            'pagination' => [
                'limit' => 20,
                'next_cursor' => null,
                'has_more' => false,
                'total' => 0,
            ],
        ]);
        // We cannot set $collection->items to null because of type hint array
        
        $result = $this->normalizer->normalize($collection, null, null);

        $this->assertArrayHasKey('items', $result);
        $this->assertIsArray($result['items']);
        $this->assertEmpty($result['items']);
    }
}
