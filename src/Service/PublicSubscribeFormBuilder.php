<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Service;

use PhpList\RestApiClient\Endpoint\ListClient;
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
    ) {
    }

    /**
     * @return list<array<string,mixed>>
     */
    public function buildAttributeConfig(array $pageData): array
    {
        $attributes = $pageData['attributes'] ?? [];
        $selectedIds = array_map(static fn ($attribute) => $attribute['id'], $attributes);
        $selectedLookup = array_fill_keys($selectedIds, true);
        $overrides = $this->loadAttributeOverrides($pageData);

        $builtAttributes = [];
        foreach ($attributes as $attribute) {
            if (!$this->shouldIncludeAttribute($attribute, $selectedIds, $selectedLookup, $overrides)) {
                continue;
            }
            $builtAttributes[] = $this->mapAttributeConfig($attribute, $overrides);
        }

        usort(
            $builtAttributes,
            static fn (array $right, array $left): int =>
                [$left['type'], $left['id']] <=> [$right['type'], $right['id']]
        );

        return $builtAttributes;
    }

    private function shouldIncludeAttribute(
        array $attribute,
        array $selectedIds,
        array $selectedLookup,
        array $overrides
    ): bool {
        $overrideUse = $overrides['use'][$attribute['id']] ?? null;
        if ($overrideUse !== null) {
            return (bool) $overrideUse;
        }

        return $selectedIds !== [] && isset($selectedLookup[$attribute['id']]);
    }

    private function mapAttributeConfig(array $attribute, array $overrides): array
    {
        $options = $attribute['options'] ?? [];
        usort(
            $options,
            static fn (array $left, array $right): int =>
                [$left['list_order'], $left['id']] <=> [$right['list_order'], $right['id']]
        );

        return [
            'id' => $attribute['id'],
            'name' => (string) ($attribute['name'] ?? ('Attribute ' . $attribute['id'])),
            'type' => $attribute['type'],
            'required' => $overrides['required'][$attribute['id']] ?? (bool) ($attribute['required'] ?? false),
            'default_value' => $overrides['default'][$attribute['id']] ?? (string) ($attribute['default_value'] ?? ''),
            'list_order' => $overrides['order'][$attribute['id']] ?? (int) ($attribute['list_order'] ?? 0),
            'options' => $options,
        ];
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
