<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Service;

/**
 * Validator for public subscribe form data.
 * Handles validation of email, lists, attributes, and honeypot field.
 */
class PublicSubscribeFormValidator
{
    public function __construct(
        private readonly ListSelectionService $listSelectionService,
        private readonly AttributeValidator $attributeValidator,
    ) {
    }

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
        $rawSelectedLists = is_array($formData['selected_lists'] ?? null) ? $formData['selected_lists'] : [];
        $selectedLists = array_values(array_unique(array_map('intval', $rawSelectedLists)));

        if (($formData['honeypot'] ?? '') !== '') {
            $errors[] = 'Submission rejected.';
            return $errors;
        }

        $this->validateEmail($email, $errors);
        $this->validateEmailDoubleEntry($email, $emailConfirm, $emailDoubleEntry, $errors);
        $listSelectionError = $this->listSelectionService->validateSelection($selectedLists, $availableListIds);
        if ($listSelectionError !== null) {
            $errors[] = $listSelectionError;
        }

        $attributeValues = is_array($formData['attributes'] ?? null) ? $formData['attributes'] : [];
        $errors = array_merge(
            $errors,
            $this->attributeValidator->validateRequiredAttributes($attributeValues, $attributes)
        );

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
}
