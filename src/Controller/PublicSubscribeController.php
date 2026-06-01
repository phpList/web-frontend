<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use PhpList\Core\Core\ApplicationStructure;
use PhpList\RestApiClient\Endpoint\AuthClient;
use PhpList\RestApiClient\Endpoint\SubscribePagesClient;
use PhpList\RestApiClient\Entity\Administrator;
use PhpList\RestApiClient\Exception\ApiException;
use PhpList\RestApiClient\Exception\ValidationException;
use PhpList\WebFrontend\Service\LanguageService;
use PhpList\WebFrontend\Service\ListSelectionService;
use PhpList\WebFrontend\Service\PublicSubscribeFormBuilder;
use PhpList\WebFrontend\Service\PublicSubscribeFormValidator;
use PhpList\WebFrontend\Service\SubscriptionService;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('', name: 'public_')]
class PublicSubscribeController extends BaseController
{
    public function __construct(
        private readonly SubscribePagesClient $subscribePagesClient,
        protected AuthClient $authClient,
        private readonly SubscriptionService $subscriptionService,
        private readonly LanguageService $languageService,
        private readonly ListSelectionService $listSelectionService,
        private readonly PublicSubscribeFormBuilder $formBuilder,
        private readonly PublicSubscribeFormValidator $formValidator,
        #[Autowire('%app.show_unsubscribe_link%')]
        private readonly bool $showUnsubscribeLink = true,
    ) {
        parent::__construct($authClient);
    }

    #[Route('/unsubscribe/{pageId}', name: 'unsubscribe', methods: ['GET', 'POST'])]
    public function delete(Request $request, int $pageId): Response
    {
        $page = $this->subscribePagesClient->getPublicSubscribePage($pageId);
        $pageData = $page->data;

        $successHtml = null;
        if ($request->isMethod('POST')) {
            $email = trim((string) $request->request->get('email'));

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw $this->createNotFoundException('Invalid email address.');
            }

            $availableListIds = $this->listSelectionService->parseAvailableListIds($pageData['lists'] ?? '');

            foreach ($availableListIds as $listId) {
                $this->subscriptionService->unsubscribe($listId, $email);
            }

            $languageFile = $pageData['language_file'] ?? 'english.inc';
            $languageTexts = $this->languageService->loadLanguageTexts(is_string($languageFile) ? $languageFile : null);

            $successHtml = $languageTexts['strUnsubscribeDone'] ?? 'You have been unsubscribed successfully.';
        }

        return $this->render('@PhpListFrontend/public/unsubscribe.html.twig', [
            'page' => 'Unsubscribe Page',
            'api_token' => $request->getSession()->get('auth_token'),
            'api_base_url' => $this->getParameter('api_base_url'),
            'page_id' => $pageId,
            'success_html' => $successHtml,
            'header' => $pageData['header'],
        ]);
    }

    #[Route('/subscribe/styles/{fileName}', name: 'subscribe_styles')]
    public function getStylesheets(string $fileName): Response
    {
        $applicationRoot = (new ApplicationStructure())->getApplicationRoot();
        return $this->file($applicationRoot . '/public/build/' . $fileName);
    }

    #[Route('/subscribe/{pageId}', name: 'subscribe', requirements: ['pageId' => '\d+'], methods: ['GET', 'POST'])]
    public function show(Request $request, int $pageId): Response
    {
        $admin = $this->getAdmin();
        $page = $this->subscribePagesClient->getPublicSubscribePage($pageId);
        $data = $page->data;
        $isSubmitted = $request->isMethod('POST');

        $languageFile = $data['language_file'] ?? 'english.inc';
        $languageTexts = $this->languageService->loadLanguageTexts(is_string($languageFile) ? $languageFile : null);

        $htmlChoice = $this->formBuilder->normalizeHtmlChoice($data['htmlchoice'] ?? null);
        $emailDoubleEntry = strtolower($data['emaildoubleentry'] ?? '') === 'yes';

        $availableListIds = $this->listSelectionService->parseAvailableListIds($data['lists'] ?? '');
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
                    return $this->subscribeAndRender(
                        formData: $formData,
                        attributes: $attributes,
                        admin: $admin,
                        pageId: $pageId,
                        data: $data,
                        languageTexts: $languageTexts
                    );
                } catch (ValidationException | ApiException $exception) {
                    $errorMessages[] = $exception->getMessage();
                }
            }
        }

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
            'header' => $data['header'],
        ]);
    }

    private function subscribeAndRender(
        array $formData,
        array $attributes,
        ?Administrator $admin = null,
        int $pageId = 0,
        array $data = [],
        array $languageTexts = []
    ): Response {
        $this->subscriptionService->subscribe($formData, $attributes, $admin !== null);
        $successHtml = trim((string) ($data['thankyoupage'] ?? ''));

        return $this->render('@PhpListFrontend/public/thank-you.html.twig', [
            'admin' => $admin,
            'admin_page_url' => $this->generateUrl('public_edit', ['pageId' => $pageId]),
            'success_html' => $successHtml,
            'language_texts' => $languageTexts,
        ]);
    }
}
