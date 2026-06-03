<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Service;

use PhpList\Core\Domain\Subscription\Service\Manager\SubscribePageManager;
use Symfony\Component\HttpFoundation\Request;

/**
 * Builder for public subscribe form data.
 * Handles form data construction, attribute configuration, and list loading.
 */
class PublicSubscribeFormBuilder
{
    public function __construct(
        private readonly FormDataMapper $formDataMapper,
        private readonly SubscribePageManager $subscribePageManager,
    ) {
    }

    /**
     * @return list<array<string,mixed>>
     */
    public function buildAttributeConfig(array $pageData): array
    {
        $attributes = $pageData['attributes'] ?? [];
        $overrides = $this->subscribePageManager->extractLegacyOverrides($pageData);

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
}
