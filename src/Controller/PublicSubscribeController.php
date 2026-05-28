<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use PhpList\Core\Core\ApplicationStructure;
use PhpList\Core\Domain\Configuration\Model\ConfigOption;
use PhpList\Core\Domain\Configuration\Service\Provider\ConfigProvider;
use PhpList\RestApiClient\Client;
use PhpList\RestApiClient\Endpoint\AuthClient;
use PhpList\RestApiClient\Endpoint\ListClient;
use PhpList\RestApiClient\Endpoint\SubscribePagesClient;
use PhpList\RestApiClient\Entity\PublicSubscriberList;
use PhpList\RestApiClient\Exception\ApiException;
use PhpList\RestApiClient\Exception\AuthenticationException;
use PhpList\RestApiClient\Exception\ValidationException;
use PhpList\WebFrontend\Service\SubscriptionService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class PublicSubscribeController extends AbstractController
{
    public function __construct(
        private readonly SubscribePagesClient $subscribePagesClient,
        private readonly ListClient $listClient,
        private readonly Client $apiClient,
        private readonly AuthClient $authClient,
        private readonly ConfigProvider $configProvider,
        private readonly SubscriptionService $subscriptionService,
        #[Autowire('%app.show_unsubscribe_link%')]
        private readonly bool $showUnsubscribeLink = true,
    ) {
    }

    #[Route('/subscribe/{pageId}', name: 'public_unsubscribe', methods: ['DELETE'])]
    public function delete(Request $request): Response
    {
        return $this->render('@PhpListFrontend/spa.html.twig', [
            'page' => 'Unsubscribe Page',
            'api_token' => $request->getSession()->get('auth_token'),
            'api_base_url' => $this->getParameter('api_base_url'),
        ]);
    }

    #[Route('/subscribe/{pageId}', name: 'public_subscribe', requirements: ['pageId' => '\d+'], methods: ['GET', 'POST'])]
    public function show(Request $request, int $pageId): Response
    {
        try {
            $admin = $this->authClient->getSessionUser();
        } catch (AuthenticationException $e) {
            $admin = null;
        }

        $page = $this->subscribePagesClient->getSubscribePage($pageId);
        $isSubmitted = $request->isMethod('POST');

        $data = array_column($page->data, 'value', 'key');
        $htmlChoice = $this->normalizeHtmlChoice($data['htmlchoice'] ?? null);
        $emailDoubleEntry = isset($data['emaildoubleentry']) && strtolower((string) $data['emaildoubleentry']) === 'yes';

        $availableListIds = $this->parseNumericIds($data['lists'] ?? '');
        $lists = $this->loadPublicLists($availableListIds);
        $availableListIds = array_map(
            static fn ($list): int => (int) $list->id,
            $lists
        );

        $attributes = $this->buildAttributeConfig($data);
        $formData = $this->buildInitialFormData(
            $request,
            $emailDoubleEntry,
            $htmlChoice,
            $data,
            $availableListIds,
            $attributes
        );

        $errorMessages = [];

        if ($isSubmitted) {
            $errorMessages = $this->validateFormData(
                $formData,
                $emailDoubleEntry,
                $availableListIds,
                $attributes
            );

            if ($errorMessages === []) {
                try {
                    $this->subscriptionService->subscribe($formData, $attributes, $admin !== null);
                    $successHtml = trim((string) ($data['thankyoupage'] ?? ''));
                    $successMessage = $this->lang($data, 'strEmailConfirmation', 'Subscription request accepted.');
                    return $this->render('@PhpListFrontend/public/thank-you.html.twig', [
                        'admin' => $admin,
                        'admin_page_url' => $this->generateUrl('public_edit', ['pageId' => $pageId]),
                        'success_message' => $successMessage,
                        'success_html' => $successHtml,
                    ]);
                } catch (ValidationException $exception) {
                    $errorMessages[] = $exception->getMessage();
                } catch (ApiException $exception) {
                    $errorMessages[] = $exception->getMessage();
                }
            }
        }

        $languageFile = $data['language_file'] ?? 'english.inc';
        $languageTexts = $this->loadLanguageTexts(is_string($languageFile) ? $languageFile : null);

        $data['header'] = str_replace(
            '[ORGANISATION_NAME]',
            $this->configProvider->getValue(ConfigOption::OrganisationName),
            (string) ($data['header'] ?? '')
        );

        return $this->render('@PhpListFrontend/public/subscribe.html.twig', [
            'page' => $page,
            'page_id' => $pageId,
            'api_token' => $request->getSession()->get('auth_token'),
            'data' => $data,
            'language_texts' => $languageTexts,
            'lists' => $lists,
            'attributes' => $attributes,
            'form_data' => $formData,
            'form_errors' => $errorMessages,
            'is_submitted' => $isSubmitted,
            'html_choice' => $htmlChoice,
            'email_double_entry' => $emailDoubleEntry,
            'admin' => $admin,
            'admin_page_url' => $this->generateUrl('public_edit', ['pageId' => $pageId]),
            'show_unsubscribe_link' => $this->showUnsubscribeLink,
            'unsubscribe_link' => $this->generateUrl('public_unsubscribe', ['pageId' => $pageId]),
        ]);
    }

    /**
     * @return list<array<string,mixed>>
     */
    private function buildAttributeConfig(array $pageData): array
    {
        $rawAttributes = $this->loadRawAttributes();
        $selectedIds = $this->parseNumericIds((string) ($pageData['attributes'] ?? ''));
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

            if (! $include) {
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
            if (! is_string($key)) {
                continue;
            }

            if (! preg_match('/^attribute_(\d+)_(use|required|default|order)$/', $key, $matches)) {
                continue;
            }

            $attributeId = (int) $matches[1];
            $suffix = $matches[2];

            if ($suffix === 'use') {
                $result['use'][$attributeId] = $this->isTruthy($value);
                continue;
            }

            if ($suffix === 'required') {
                $result['required'][$attributeId] = $this->isTruthy($value);
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
        if (! is_array($options)) {
            return [];
        }

        $normalized = [];
        foreach ($options as $option) {
            if (! is_array($option)) {
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
            $query = ['limit' => $pageLimit];
            if ($afterId !== null) {
                $query['after_id'] = $afterId;
            }

            $response = $this->apiClient->get('/attributes', $query);
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
            if (! $hasMore || ! is_numeric($nextCursor)) {
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
    private function buildInitialFormData(
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

        if (! $request->isMethod('POST')) {
            if ($request->query->has('email')) {
                $defaults['email'] = trim((string) $request->query->get('email', ''));
            }
            if ($request->query->has('htmlemail')) {
                $defaults['htmlemail'] = ((int) $request->query->get('htmlemail', 1)) === 1;
            }
            if (! $emailDoubleEntry) {
                $defaults['email_confirm'] = '';
            }

            return $defaults;
        }

        $form = $request->request;
        $selectedLists = $this->parseNumericIds($form->all('lists'));
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
                $values[$attributeId] = $this->parseNumericIds((string) $defaultValue);
                continue;
            }

            if ($type === 'checkbox') {
                $values[$attributeId] = $this->isTruthy($defaultValue);
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
                $values[$attributeId] = $this->parseNumericIds($rawValue);
                continue;
            }

            $values[$attributeId] = trim((string) ($posted[$field] ?? ''));
        }

        return $values;
    }

    /**
     * @param array<string,mixed> $formData
     * @param list<int> $availableListIds
     * @param list<array<string,mixed>> $attributes
     * @return list<string>
     */
    private function validateFormData(
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

        if ($email === '') {
            $errors[] = 'Please enter your email address.';
        } elseif (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Email address is not valid.';
        }

        if ($emailDoubleEntry && $email !== $emailConfirm) {
            $errors[] = 'Email addresses you entered do not match.';
        }

        if ($selectedLists === []) {
            $errors[] = 'Please select a newsletter to subscribe to.';
        } else {
            foreach ($selectedLists as $selectedListId) {
                if (! isset($allowedListLookup[$selectedListId])) {
                    $errors[] = 'One or more selected lists are not available.';
                    break;
                }
            }
        }

        $attributeValues = is_array($formData['attributes'] ?? null) ? $formData['attributes'] : [];

        foreach ($attributes as $attribute) {
            if (! ($attribute['required'] ?? false)) {
                continue;
            }

            $attributeId = (int) $attribute['id'];
            $value = $attributeValues[$attributeId] ?? null;
            $type = (string) ($attribute['type'] ?? 'textline');
            $name = (string) ($attribute['name'] ?? ('Attribute ' . $attributeId));

            if ($type === 'checkbox' && $value !== true) {
                $errors[] = sprintf('The following field is required: %s', $name);
                continue;
            }

            if ($type === 'checkboxgroup' && (! is_array($value) || $value === [])) {
                $errors[] = sprintf('Please enter your %s', $name);
                continue;
            }

            if ($type !== 'checkbox' && $type !== 'checkboxgroup' && trim((string) $value) === '') {
                $errors[] = sprintf('Please enter your %s', $name);
            }
        }

        return array_values(array_unique($errors));
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
     * @return list<PublicSubscriberList>
     */
    private function loadPublicLists(array $listIds): array
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
            'checkfortext' => ! isset($posted['textemail']),
            'radiotext', 'radiohtml' => ((int) ($posted['htmlemail'] ?? 0)) === 1,
            default => isset($posted['htmlemail']),
        };
    }

    private function normalizeHtmlChoice(mixed $value): string
    {
        $normalized = strtolower(trim((string) $value));
        return match ($normalized) {
            'textonly', 'htmlonly', 'checkfortext', 'checkforhtml', 'radiotext', 'radiohtml' => $normalized,
            default => 'checkforhtml',
        };
    }

    /**
     * @param string|array<int,mixed>|null $value
     * @return list<int>
     */
    private function parseNumericIds(string|array|null $value): array
    {
        if ($value === null) {
            return [];
        }

        $parts = (is_array($value) ? $value : preg_split('/\s*,\s*/', (string)$value)) ?: [];
        $ids = [];
        foreach ($parts as $part) {
            if (! is_scalar($part) || ! is_numeric((string) $part)) {
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

    private function isTruthy(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        return in_array(strtolower(trim((string) $value)), ['1', 'true', 'yes', 'on'], true);
    }

    private function lang(array $data, string $key, string $fallback): string
    {
        $languageFile = $data['language_file'] ?? 'english.inc';
        $languageTexts = $this->loadLanguageTexts(is_string($languageFile) ? $languageFile : null);
        $value = $languageTexts[$key] ?? $fallback;
        return is_string($value) && $value !== '' ? $value : $fallback;
    }

    /**
     * @return array<string, string>
     */
    private function loadLanguageTexts(?string $languageFile): array
    {
        $applicationRoot = (new ApplicationStructure())->getApplicationRoot();
        $languageDir = $applicationRoot . '/public/lists/texts';

        if (!is_dir($languageDir)) {
            return [];
        }

        $selectedFile = $this->sanitizeLanguageFile($languageFile) ?? 'english.inc';
        $languagePath = $languageDir . '/' . $selectedFile;

        if (!is_file($languagePath)) {
            $languagePath = $languageDir . '/english.inc';
        }

        if (!is_file($languagePath)) {
            return [];
        }

        $loader = static function (string $path): array {
            require $path;

            return array_map(function ($value) {
                return $value;
            }, get_defined_vars());
        };

        return $loader($languagePath);
    }

    private function sanitizeLanguageFile(?string $languageFile): ?string
    {
        if (!is_string($languageFile) || $languageFile === '') {
            return null;
        }

        $languageFile = basename($languageFile);

        if (!preg_match('/^[A-Za-z0-9._-]+\.inc$/', $languageFile)) {
            return null;
        }

        return $languageFile;
    }
}
