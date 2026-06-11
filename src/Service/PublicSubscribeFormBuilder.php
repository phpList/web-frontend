<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Service;

use Symfony\Component\HttpFoundation\Request;

/**
 * Builder for public subscribe form data.
 * Handles form data construction, attribute configuration, and list loading.
 */
class PublicSubscribeFormBuilder
{
    public function __construct(
        private readonly FormDataMapper $formDataMapper,
    ) {
    }

    /**
     * @return list<array<string,mixed>>
     */
    public function buildAttributeConfig(array $pageData): array
    {
        $attributes = $pageData['attributes'] ?? [];
        $overrides = $this->extractLegacyOverrides($pageData);

        $builtAttributes = [];
        foreach ($attributes as $attribute) {
            $builtAttributes[] = $this->mapAttributeConfig($attribute, $overrides);
        }

        usort(
            $builtAttributes,
            static fn (array $right, array $left): int =>
                [$left['type'], $left['list_order']] <=> [$right['type'], $right['list_order']]
        );

        return $builtAttributes;
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
            'required' => $overrides[$attribute['id']]['required'] ?? (bool) ($attribute['required'] ?? false),
            'default_value' => $overrides[$attribute['id']]['default'] ?? (string) ($attribute['default_value'] ?? ''),
            'list_order' => $overrides[$attribute['id']]['order'] ?? (int) ($attribute['list_order'] ?? 0),
            'options' => $options,
        ];
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

    public function normalizeHtmlChoice(mixed $value): string
    {
        $normalized = strtolower(trim((string) $value));
        return match ($normalized) {
            'textonly', 'htmlonly', 'checkfortext', 'checkforhtml', 'radiotext', 'radiohtml' => $normalized,
            default => 'checkforhtml',
        };
    }

    /**
     * @param array<string,mixed> $pageData
     * @return array<int,array{default?:string,order?:int,required?:bool}>
     */
    private function extractLegacyOverrides(array $pageData): array
    {
        $result = [];
        foreach ($pageData as $key => $value) {
            if (!preg_match('/^attribute(\d{1,})$/', (string) $key, $matches)) {
                continue;
            }

            $id = (int) $matches[1];
            $parts = explode('###', (string) $value);
            if (isset($parts[1])) {
                $result[$id]['default'] = $parts[1];
            }
            if (isset($parts[2])) {
                $result[$id]['order'] = (int) $parts[2];
            }
            if (isset($parts[3])) {
                $result[$id]['required'] = $parts[3] === '1';
            }
        }

        return $result;
    }
}
