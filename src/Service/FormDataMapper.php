<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Service;

use Symfony\Component\HttpFoundation\Request;

class FormDataMapper
{
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

        return [
            'email' => trim((string) $form->get('email', '')),
            'email_confirm' => trim((string) $form->get('emailconfirm', '')),
            'make_confirmed' => $form->get('makeconfirmed', '0') === '1' ? '1' : '0',
            'htmlemail' => $this->resolveHtmlEmailFromRequest($htmlChoice, $form->all()),
            'selected_lists' => $this->parseNumericIds($form->all('lists')),
            'attributes' => $this->extractPostedAttributeValues($form->all(), $attributes),
            'honeypot' => trim((string) $form->get('VerificationCodeX', '')),
        ];
    }

    /**
     * Check if a value is truthy (handles string, bool, and other types).
     */
    public function isTruthy(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        return in_array(strtolower(trim((string) $value)), ['1', 'true', 'yes', 'on'], true);
    }

    /**
     * Parse numeric IDs from a string or array.
     *
     * @param string|array<int,mixed>|null $value
     * @return list<int>
     */
    public function parseNumericIds(string|array|null $value): array
    {
        if ($value === null) {
            return [];
        }

        $parts = (is_array($value) ? $value : preg_split('/\s*,\s*/', (string) $value)) ?: [];
        $ids = [];
        foreach ($parts as $part) {
            if (!is_scalar($part) || !is_numeric((string) $part)) {
                continue;
            }

            $id = (int) $part;
            if ($id > 0) {
                $ids[$id] = true;
            }
        }

        $result = array_map('intval', array_keys($ids));
        sort($result);

        return $result;
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

            $values[$attributeId] = match ($type) {
                'checkboxgroup' => $this->parseNumericIds((string) $defaultValue),
                'checkbox' => $this->isTruthy($defaultValue),
                default => (string) $defaultValue,
            };
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

            $values[$attributeId] = match ($type) {
                'checkbox' => isset($posted[$field]),
                'checkboxgroup' => $this->parseNumericIds($posted[$field] ?? []),
                default => trim((string) ($posted[$field] ?? '')),
            };
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
}
