<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Service;

use DateTimeImmutable;
use PhpList\RestApiClient\Entity\Subscriber;
use PhpList\RestApiClient\Response\Subscribers\SubscriberCollection;

class SubscriberCollectionNormalizer
{
    public function normalize(SubscriberCollection $collection, ?int $prevId, ?int $afterId): array
    {
        return [
            'items' => array_map(static function (Subscriber $subscriber) {
                return [
                    'id' => $subscriber->id,
                    'email' => $subscriber->email,
                    'confirmed' => $subscriber->confirmed,
                    'blacklisted' => $subscriber->blacklisted,
                    'createdAt' => (new DateTimeImmutable($subscriber->createdAt))->format('Y-m-d H:i:s'),
                    'uniqueId' => $subscriber->uniqueId,
                    'listCount' => count($subscriber->subscribedLists),
                ];
            }, $collection->items ?? []),
            'pagination' => [
                'limit' => $collection->pagination->limit,
                'afterId' => $collection->pagination->nextCursor,
                'hasMore' => $collection->pagination->hasMore,
                'total' => $collection->pagination->total,
                'prevId' => $prevId,
                'isFirstPage' => $afterId === null,
            ],
        ];
    }
}
