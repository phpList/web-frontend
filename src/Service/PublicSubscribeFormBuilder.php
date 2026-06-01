<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Service;

use PhpList\RestApiClient\Endpoint\ListClient;
use PhpList\RestApiClient\Endpoint\SubscriberAttributesClient;
use PhpList\RestApiClient\Entity\SubscriberAttributeDefinition;
use PhpList\RestApiClient\Exception\ApiException;
use Symfony\Component\HttpFoundation\Request;

/**
 * Builder for public subscribe form data.
 * Handles form data construction, attribute configuration, and list loading.
 */
class PublicSubscribeFormBuilder
{
    public function __construct(
        private readonly ListClient $listClient,
        private readonly FormDataMapper $formDataMapper,
        private readonly SubscriberAttributesClient $attributesClient,
    ) {
    }

    /**
     * @return list<array<string,mixed>>
     */
    public function buildAttributeConfig(array $pageData): array
    {
        $rawAttributes = $this->loadRawAttributes();
        $selectedIds = $this->formDataMapper->parseNumericIds((string) ($pageData['attributes'] ?? ''));
        $selectedIdLookup = array_fill_keys($selectedIds, true);
        $overrides = $this->loadAttributeOverrides($pageData);
        $attributes = [];

        /** @var SubscriberAttributeDefinition $attribute */
        foreach ($rawAttributes as $attribute) {
            $hasSelection = $selectedIds !== [];
            $isSelected = isset($selectedIdLookup[$attribute->id]);
            $overrideUse = $overrides['use'][$attribute->id] ?? null;

            if ($overrideUse !== null) {
                $include = (bool) $overrideUse;
            } else {
                $include = $hasSelection ? $isSelected : false;
            }

            if (!$include) {
                continue;
            }

            $required = $overrides['required'][$attribute->id] ?? (bool) ($attribute->required ?? false);
            $defaultValue = $overrides['default'][$attribute->id] ?? (string) ($attribute->de->default_value ?? '');
            $listOrder = $overrides['order'][$attribute->id] ?? (int) ($attribute->listOrder);

            $attributes[] = [
                'id' => $attribute->id,
                'name' => (string) ($attribute->name ?? ('Attribute ' . $attribute->id)),
                'type' => $attribute->type,
                'required' => (bool) $required,
                'default_value' => $defaultValue,
                'list_order' => $listOrder,
                'options' => $this->normalizeAttributeOptions($attribute->options ?? []),
            ];
        }

        usort(
            $attributes,
            static fn (array $left, array $right): int =>
                [$left['list_order'], $left['id']] <=> [$right['list_order'], $right['id']]
        );

        return $attributes;
    }

    /**
     * @return array{
     *     use: array<int,bool>,
     *     required: array<int,bool>,
     *     default: array<int,string>,
     *     order: array<int,int>
     * }
     */
    private function loadAttributeOverrides(array $pageData): array
    {
        $result = [
            'use' => [],
            'required' => [],
            'default' => [],
            'order' => [],
        ];

        foreach ($pageData as $key => $value) {
            if (!is_string($key)) {
                continue;
            }

            if (!preg_match('/^attribute_(\d+)_(use|required|default|order)$/', $key, $matches)) {
                continue;
            }

            $attributeId = (int) $matches[1];
            $suffix = $matches[2];

            match ($suffix) {
                'use' => $result['use'][$attributeId] = $this->formDataMapper->isTruthy($value),
                'required' => $result['required'][$attributeId] = $this->formDataMapper->isTruthy($value),
                'default' => $result['default'][$attributeId] = (string) $value,
                'order' => is_numeric($value) ? $result['order'][$attributeId] = (int) $value : null,
            };
        }

        return $result;
    }

    /**
     * @return list<array<string,mixed>>
     */
    private function normalizeAttributeOptions(array $options): array
    {
        $normalized = array_map(fn ($item) => $item->toArray(), $options);

        usort(
            $normalized,
            static fn (array $left, array $right): int =>
                [$left['list_order'], $left['id']] <=> [$right['list_order'], $right['id']]
        );

        return $normalized;
    }

    private function loadRawAttributes(): array
    {
        $attributes = [];
        $afterId = null;
        $pageLimit = 100;
        $maxPages = 100;

        for ($page = 0; $page < $maxPages; ++$page) {
            $response = $this->attributesClient->getAttributeDefinitions($afterId, $pageLimit);
            $items = $response->items ?? [];
            if ($items === []) {
                break;
            }

            foreach ($items as $item) {
                $attributes[] = $item;
            }

            $pagination = $response->pagination;
            $hasMore = $pagination->hasMore;
            $nextCursor = $pagination->nextCursor;
            if (!$hasMore || !is_numeric($nextCursor)) {
                break;
            }

            $afterId = (int) $nextCursor;
        }

        return $attributes;
    }

    /**
     * @param list<int> $availableListIds
     * @param list<array<string,mixed>> $attributes
     * @return array<string,mixed>
     */
    public function buildInitialFormData(
        Request $request,
        bool $emailDoubleEntry,
        string $htmlChoice,
        array $pageData,
        array $availableListIds,
        array $attributes
    ): array {
        return $this->formDataMapper->buildInitialFormData(
            $request,
            $emailDoubleEntry,
            $htmlChoice,
            $pageData,
            $availableListIds,
            $attributes
        );
    }

    /**
     * @param list<int> $listIds
     * @return list<object>
     */
    public function loadPublicLists(array $listIds): array
    {
        $lists = [];
        foreach ($listIds as $listId) {
            try {
                $lists[] = $this->listClient->getPublicList((int) $listId);
            } catch (ApiException) {
                continue;
            }
        }

        usort(
            $lists,
            static fn ($left, $right): int =>
                [($left->listPosition ?? 0), $left->id] <=> [($right->listPosition ?? 0), $right->id]
        );

        return $lists;
    }

    public function normalizeHtmlChoice(mixed $value): string
    {
        $normalized = strtolower(trim((string) $value));
        return match ($normalized) {
            'textonly', 'htmlonly', 'checkfortext', 'checkforhtml', 'radiotext', 'radiohtml' => $normalized,
            default => 'checkforhtml',
        };
    }
}
