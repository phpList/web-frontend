<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use PhpList\Core\Domain\Configuration\Model\ConfigOption;
use PhpList\Core\Domain\Configuration\Service\Provider\ConfigProvider;
use PhpList\RestApiClient\Endpoint\AuthClient;
use PhpList\RestApiClient\Endpoint\SubscribePagesClient;
use PhpList\RestApiClient\Exception\ApiException;
use PhpList\RestApiClient\Exception\AuthenticationException;
use PhpList\RestApiClient\Exception\ValidationException;
use PhpList\WebFrontend\Service\LanguageService;
use PhpList\WebFrontend\Service\PublicSubscribeFormBuilder;
use PhpList\WebFrontend\Service\PublicSubscribeFormValidator;
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
        private readonly AuthClient $authClient,
        private readonly ConfigProvider $configProvider,
        private readonly SubscriptionService $subscriptionService,
        private readonly LanguageService $languageService,
        private readonly PublicSubscribeFormBuilder $formBuilder,
        private readonly PublicSubscribeFormValidator $formValidator,
        #[Autowire('%app.show_unsubscribe_link%')]
        private readonly bool $showUnsubscribeLink = true,
    ) {
    }

    #[Route('/unsubscribe/{pageId}', name: 'public_unsubscribe', methods: ['GET', 'POST'])]
    public function delete(Request $request, int $pageId): Response
    {
        if ($request->isMethod('POST')) {
            $email = trim((string) $request->request->get('email'));

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw $this->createNotFoundException('Invalid email address.');
            }

            $page = $this->subscribePagesClient->getSubscribePage($pageId);
            $availableListIds = $this->formValidator->parseNumericIds($page->data['lists'] ?? '');

            foreach ($availableListIds as $listId) {
                $this->subscriptionService->unsubscribe($listId, $email);
            }
        }

        return $this->render('@PhpListFrontend/public/unsubscribe.html.twig', [
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

        $languageFile = $data['language_file'] ?? 'english.inc';
        $languageTexts = $this->languageService->loadLanguageTexts(is_string($languageFile) ? $languageFile : null);

        $htmlChoice = $this->formBuilder->normalizeHtmlChoice($data['htmlchoice'] ?? null);
        $emailDoubleEntry = isset($data['emaildoubleentry']) && strtolower((string) $data['emaildoubleentry']) === 'yes';

        $availableListIds = $this->formValidator->parseNumericIds($data['lists'] ?? '');
        $lists = $this->formBuilder->loadPublicLists($availableListIds);
        $availableListIds = array_map(
            static fn ($list): int => (int) $list->id,
            $lists
        );

        $attributes = $this->formBuilder->buildAttributeConfig($data);
        $formData = $this->formBuilder->buildInitialFormData(
            $request,
            $emailDoubleEntry,
            $htmlChoice,
            $data,
            $availableListIds,
            $attributes
        );

        $errorMessages = [];

        if ($isSubmitted) {
            $errorMessages = $this->formValidator->validateFormData(
                $formData,
                $emailDoubleEntry,
                $availableListIds,
                $attributes
            );

            if ($errorMessages === []) {
                try {
                    $this->subscriptionService->subscribe($formData, $attributes, $admin !== null);
                    $successHtml = trim((string) ($data['thankyoupage'] ?? ''));

                    return $this->render('@PhpListFrontend/public/thank-you.html.twig', [
                        'admin' => $admin,
                        'admin_page_url' => $this->generateUrl('public_edit', ['pageId' => $pageId]),
                        'success_html' => $successHtml,
                        'language_texts' => $languageTexts,
                    ]);
                } catch (ValidationException $exception) {
                    $errorMessages[] = $exception->getMessage();
                } catch (ApiException $exception) {
                    $errorMessages[] = $exception->getMessage();
                }
            }
        }

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
}
