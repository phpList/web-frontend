<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Service;

use PhpList\RestApiClient\Endpoint\SubscriberAttributesClient;
use PhpList\RestApiClient\Endpoint\SubscribersClient;
use PhpList\RestApiClient\Endpoint\SubscriptionClient;
use PhpList\RestApiClient\Entity\Subscriber;
use PhpList\RestApiClient\Exception\ApiException;
use PhpList\RestApiClient\Request\Subscriber\CreateSubscriberRequest;
use PhpList\RestApiClient\Request\Subscriber\SubscribersFilterRequest;
use PhpList\RestApiClient\Request\Subscriber\UpdateSubscriberRequest;

class SubscriptionService
{
    public function __construct(
        private readonly SubscribersClient $subscribersClient,
        private readonly SubscriptionClient $subscriptionClient,
        private readonly SubscriberAttributesClient $subscriberAttributesClient,
    ) {
    }

    public function unsubscribe(int $listId, string $email): void
    {
        $this->subscriptionClient->deleteSubscription(
            emails: [$email],
            listId: $listId
        );
    }

    /**
     * @param array<string,mixed> $formData
     * @param list<array<string,mixed>> $attributes
     * @throws ApiException
     */
    public function subscribe(array $formData, array $attributes, bool $isAdmin): void
    {
        $email = (string) $formData['email'];
        $requestConfirmation = true;
        $autoConfirm = false;
        if ($isAdmin && ($formData['make_confirmed'] ?? '0') === '1') {
            $requestConfirmation = false;
            $autoConfirm = true;
        }

        try {
            $subscriber = $this->subscribersClient->createSubscriber(
                new CreateSubscriberRequest(
                    email: $email,
                    requestConfirmation: $requestConfirmation,
                    htmlEmail: (bool) ($formData['htmlemail'] ?? true),
                )
            );
            $subscriberId = $subscriber->id > 0 ? $subscriber->id : null;
        } catch (ApiException $exception) {
            if ($exception->getStatusCode() !== 409) {
                throw $exception;
            }

            $subscriber = $this->findSubscriberByEmail($email);
            if ($subscriber === null) {
                throw $exception;
            }
            $subscriberId = $subscriber->id;
        }

        foreach ((array) ($formData['selected_lists'] ?? []) as $listId) {
            try {
                $this->subscriptionClient->createSubscriptions(
                    emails: [$email],
                    listId: (int) $listId,
                    autoConfirm: $autoConfirm
                );
            } catch (ApiException $exception) {
                if ($exception->getStatusCode() !== 409) {
                    throw $exception;
                }
            }
        }

        if ($subscriberId !== null) {
            if ($autoConfirm) {
                $this->subscribersClient->updateSubscriber(
                    id: $subscriberId,
                    request: new UpdateSubscriberRequest(
                        email: $email,
                        confirmed: true,
                        blacklisted: false,
                        htmlEmail: (bool) ($formData['htmlemail'] ?? true),
                        disabled: false,
                    )
                );
            }

            $this->saveSubscriberAttributes(subscriberId: $subscriberId, formData: $formData, attributes: $attributes);
        }
    }

    /**
     * @param list<array<string,mixed>> $attributes
     * @throws ApiException
     */
    private function saveSubscriberAttributes(int $subscriberId, array $formData, array $attributes): void
    {
        $attributeValues = is_array($formData['attributes'] ?? null) ? $formData['attributes'] : [];
        foreach ($attributes as $attribute) {
            $attributeId = (int) $attribute['id'];
            $value = $attributeValues[$attributeId] ?? null;
            $type = (string) ($attribute['type'] ?? 'textline');

            if ($type === 'checkbox') {
                $normalizedValue = $value ? 'on' : '';
            } elseif ($type === 'checkboxgroup') {
                $normalizedValue = is_array($value) ? implode(',', array_map('strval', $value)) : '';
            } else {
                $normalizedValue = trim((string) $value);
            }

            if ($normalizedValue === '' && ! ($attribute['required'] ?? false)) {
                continue;
            }

            $this->subscriberAttributesClient->setAttributeValue(
                subscriberId: $subscriberId,
                definitionId: $attributeId,
                value: $normalizedValue
            );
        }
    }

    private function findSubscriberByEmail(string $email): ?Subscriber
    {
        $collection = $this->subscribersClient->getSubscribers(
            request: new SubscribersFilterRequest(findColumn: 'email', findValue: $email),
            afterid: null,
            limit: 25
        );

        foreach ($collection->items as $item) {
            if (strcasecmp((string) $item->email, $email) === 0) {
                return $item;
            }
        }

        return null;
    }
}
