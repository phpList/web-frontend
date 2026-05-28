<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Service;

/**
 * Validator for public subscribe form data.
 * Handles validation of email, lists, attributes, and honeypot field.
 */
class PublicSubscribeFormValidator
{
    /**
     * @param array<string,mixed> $formData
     * @param list<int> $availableListIds
     * @param list<array<string,mixed>> $attributes
     * @return list<string>
     */
    public function validateFormData(
        array $formData,
        bool $emailDoubleEntry,
        array $availableListIds,
        array $attributes
    ): array {
        $errors = [];
        $email = trim((string) ($formData['email'] ?? ''));
        $emailConfirm = trim((string) ($formData['email_confirm'] ?? ''));
        $selectedLists = array_map('intval', $formData['selected_lists'] ?? []);
        $allowedListLookup = array_fill_keys($availableListIds, true);

        if (($formData['honeypot'] ?? '') !== '') {
            $errors[] = 'Submission rejected.';
            return $errors;
        }

        $this->validateEmail($email, $errors);
        $this->validateEmailDoubleEntry($email, $emailConfirm, $emailDoubleEntry, $errors);
        $this->validateListSelection($selectedLists, $allowedListLookup, $errors);
        $this->validateAttributes($formData['attributes'] ?? [], $attributes, $errors);

        return array_values(array_unique($errors));
    }

    /**
     * @param list<string> $errors
     */
    private function validateEmail(string $email, array &$errors): void
    {
        if ($email === '') {
            $errors[] = 'Please enter your email address.';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Email address is not valid.';
        }
    }

    /**
     * @param list<string> $errors
     */
    private function validateEmailDoubleEntry(
        string $email,
        string $emailConfirm,
        bool $emailDoubleEntry,
        array &$errors
    ): void {
        if ($emailDoubleEntry && $email !== $emailConfirm) {
            $errors[] = 'Email addresses you entered do not match.';
        }
    }

    /**
     * @param list<int> $selectedLists
     * @param array<int,bool> $allowedListLookup
     * @param list<string> $errors
     */
    private function validateListSelection(
        array $selectedLists,
        array $allowedListLookup,
        array &$errors
    ): void {
        if ($selectedLists === []) {
            $errors[] = 'Please select a newsletter to subscribe to.';
        } else {
            foreach ($selectedLists as $selectedListId) {
                if (!isset($allowedListLookup[$selectedListId])) {
                    $errors[] = 'One or more selected lists are not available.';
                    break;
                }
            }
        }
    }

    /**
     * @param array<int,mixed> $attributeValues
     * @param list<array<string,mixed>> $attributes
     * @param list<string> $errors
     */
    private function validateAttributes(
        array $attributeValues,
        array $attributes,
        array &$errors
    ): void {
        foreach ($attributes as $attribute) {
            if (!($attribute['required'] ?? false)) {
                continue;
            }

            $attributeId = (int) $attribute['id'];
            $value = $attributeValues[$attributeId] ?? null;
            $type = (string) ($attribute['type'] ?? 'textline');
            $name = (string) ($attribute['name'] ?? ('Attribute ' . $attributeId));

            $error = $this->validateRequiredAttribute($type, $value, $name);

            if ($error !== null) {
                $errors[] = $error;
            }
        }
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

    private function validateRequiredAttribute(string $type, mixed $value, string $name): ?string
    {
        return match ($type) {
            'checkbox' => $value === true
                ? null
                : sprintf('The following field is required: %s', $name),

            'checkboxgroup' => is_array($value) && $value !== []
                ? null
                : sprintf('Please enter your %s', $name),

            default => trim((string) $value) !== ''
                ? null
                : sprintf('Please enter your %s', $name),
        };
    }
}

