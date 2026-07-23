<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Service;

class AttributeValidator
{
    /**
     * @param array<int,mixed> $attributeValues
     * @param list<array<string,mixed>> $attributes
     * @return list<string>
     */
    public function validateRequiredAttributes(array $attributeValues, array $attributes): array
    {
        $errors = [];

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

        return $errors;
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
