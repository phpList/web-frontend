<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Service;

use PhpList\RestApiClient\Endpoint\ListClient;
use PhpList\RestApiClient\Endpoint\SubscriberAttributesClient;
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
        private readonly PublicSubscribeFormValidator $validator,
        private readonly SubscriberAttributesClient $attributesClient,
    ) {
    }

    /**
     * @return list<array<string,mixed>>
     */
    public function buildAttributeConfig(array $pageData): array
    {
        $rawAttributes = $this->loadRawAttributes();
        $selectedIds = $this->validator->parseNumericIds((string) ($pageData['attributes'] ?? ''));
        $selectedIdLookup = array_fill_keys($selectedIds, true);
        $overrides = $this->loadAttributeOverrides($pageData);
        $attributes = [];

        foreach ($rawAttributes as $attribute) {
            $attributeId = (int) ($attribute['id'] ?? 0);
            if ($attributeId <= 0) {
                continue;
            }

            $hasSelection = $selectedIds !== [];
            $isSelected = isset($selectedIdLookup[$attributeId]);
            $overrideUse = $overrides['use'][$attributeId] ?? null;

            if ($overrideUse !== null) {
                $include = (bool) $overrideUse;
            } else {
                $include = $hasSelection ? $isSelected : false;
            }

            if (!$include) {
                continue;
            }

            $type = strtolower((string) ($attribute['type'] ?? 'textline'));
            $required = $overrides['required'][$attributeId] ?? (bool) ($attribute['required'] ?? false);
            $defaultValue = $overrides['default'][$attributeId] ?? (string) ($attribute['default_value'] ?? '');
            $listOrder = $overrides['order'][$attributeId] ?? (int) ($attribute['list_order'] ?? 0);

            $attributes[] = [
                'id' => $attributeId,
                'name' => (string) ($attribute['name'] ?? ('Attribute ' . $attributeId)),
                'type' => $type,
                'required' => (bool) $required,
                'default_value' => $defaultValue,
                'list_order' => $listOrder,
                'options' => $this->normalizeAttributeOptions($attribute['options'] ?? []),
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

            if ($suffix === 'use') {
                $result['use'][$attributeId] = $this->validator->isTruthy($value);
                continue;
            }

            if ($suffix === 'required') {
                $result['required'][$attributeId] = $this->validator->isTruthy($value);
                continue;
            }

            if ($suffix === 'default') {
                $result['default'][$attributeId] = (string) $value;
                continue;
            }

            if ($suffix === 'order' && is_numeric($value)) {
                $result['order'][$attributeId] = (int) $value;
            }
        }

        return $result;
    }

    /**
     * @return list<array<string,mixed>>
     */
    private function normalizeAttributeOptions(mixed $options): array
    {
        if (!is_array($options)) {
            return [];
        }

        $normalized = [];
        foreach ($options as $option) {
            if (!is_array($option)) {
                continue;
            }

            $optionId = (int) ($option['id'] ?? 0);
            $optionName = trim((string) ($option['name'] ?? ''));
            if ($optionId <= 0 || $optionName === '') {
                continue;
            }

            $normalized[] = [
                'id' => $optionId,
                'name' => $optionName,
                'list_order' => (int) ($option['list_order'] ?? 0),
            ];
        }

        usort(
            $normalized,
            static fn (array $left, array $right): int =>
                [$left['list_order'], $left['id']] <=> [$right['list_order'], $right['id']]
        );

        return $normalized;
    }

    /**
     * @return list<array<string,mixed>>
     */
    private function loadRawAttributes(): array
    {
        $attributes = [];
        $afterId = null;
        $pageLimit = 100;
        $maxPages = 100;

        for ($page = 0; $page < $maxPages; ++$page) {
            $response = $this->attributesClient->getAttributeDefinitions($afterId, $pageLimit);
            $items = is_array($response['items'] ?? null) ? $response['items'] : [];
            if ($items === []) {
                break;
            }

            foreach ($items as $item) {
                if (is_array($item)) {
                    $attributes[] = $item;
                }
            }

            $pagination = $response['pagination'] ?? [];
            $hasMore = isset($pagination['has_more']) && (bool) $pagination['has_more'];
            $nextCursor = $pagination['next_cursor'] ?? null;
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
        $defaults = [
            'email' => '',
            'email_confirm' => '',
            'make_confirmed' => '0',
            'htmlemail' => $this->defaultHtmlEmailForChoice($htmlChoice),
            'selected_lists' => $this->defaultSelectedLists($pageData, $availableListIds),
            'attributes' => $this->defaultAttributeValues($attributes),
        ];

        if (!$request->isMethod('POST')) {
            if ($request->query->has('email')) {
                $defaults['email'] = trim((string) $request->query->get('email', ''));
            }
            if ($request->query->has('htmlemail')) {
                $defaults['htmlemail'] = ((int) $request->query->get('htmlemail', 1)) === 1;
            }
            if (!$emailDoubleEntry) {
                $defaults['email_confirm'] = '';
            }

            return $defaults;
        }

        $form = $request->request;
        $selectedLists = $this->validator->parseNumericIds($form->all('lists'));
        $attributeValues = $this->extractPostedAttributeValues($form->all(), $attributes);

        return [
            'email' => trim((string) $form->get('email', '')),
            'email_confirm' => trim((string) $form->get('emailconfirm', '')),
            'make_confirmed' => $form->get('makeconfirmed', '0') === '1' ? '1' : '0',
            'htmlemail' => $this->resolveHtmlEmailFromRequest($htmlChoice, $form->all()),
            'selected_lists' => $selectedLists,
            'attributes' => $attributeValues,
            'honeypot' => trim((string) $form->get('VerificationCodeX', '')),
        ];
    }

    /**
     * @param list<array<string,mixed>> $attributes
     * @return array<int,mixed>
     */
    private function defaultAttributeValues(array $attributes): array
    {
        $values = [];

        foreach ($attributes as $attribute) {
            $attributeId = (int) $attribute['id'];
            $type = (string) $attribute['type'];
            $defaultValue = $attribute['default_value'];

            if ($type === 'checkboxgroup') {
                $values[$attributeId] = $this->validator->parseNumericIds((string) $defaultValue);
                continue;
            }

            if ($type === 'checkbox') {
                $values[$attributeId] = $this->validator->isTruthy($defaultValue);
                continue;
            }

            $values[$attributeId] = (string) $defaultValue;
        }

        return $values;
    }

    /**
     * @param array<string,mixed> $posted
     * @param list<array<string,mixed>> $attributes
     * @return array<int,mixed>
     */
    private function extractPostedAttributeValues(array $posted, array $attributes): array
    {
        $values = [];

        foreach ($attributes as $attribute) {
            $attributeId = (int) $attribute['id'];
            $field = 'attribute' . $attributeId;
            $type = (string) $attribute['type'];

            if ($type === 'checkbox') {
                $values[$attributeId] = isset($posted[$field]);
                continue;
            }

            if ($type === 'checkboxgroup') {
                $rawValue = $posted[$field] ?? [];
                $values[$attributeId] = $this->validator->parseNumericIds($rawValue);
                continue;
            }

            $values[$attributeId] = trim((string) ($posted[$field] ?? ''));
        }

        return $values;
    }

    /**
     * @param list<int> $availableListIds
     * @return list<int>
     */
    private function defaultSelectedLists(array $pageData, array $availableListIds): array
    {
        $preselectId = (int) ($pageData['preselectlist'] ?? 0);
        if ($preselectId > 0 && in_array($preselectId, $availableListIds, true)) {
            return [$preselectId];
        }

        return [];
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

    private function defaultHtmlEmailForChoice(string $htmlChoice): bool
    {
        return match ($htmlChoice) {
            'textonly', 'radiotext' => false,
            default => true,
        };
    }

    /**
     * @param array<string,mixed> $posted
     */
    private function resolveHtmlEmailFromRequest(string $htmlChoice, array $posted): bool
    {
        return match ($htmlChoice) {
            'textonly' => false,
            'htmlonly' => true,
            'checkfortext' => !isset($posted['textemail']),
            'radiotext', 'radiohtml' => ((int) ($posted['htmlemail'] ?? 0)) === 1,
            default => isset($posted['htmlemail']),
        };
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

