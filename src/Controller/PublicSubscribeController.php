<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Controller;

use PhpList\Core\Core\ApplicationStructure;
use PhpList\Core\Domain\Configuration\Model\ConfigOption;
use PhpList\Core\Domain\Configuration\Service\Provider\ConfigProvider;
use PhpList\RestApiClient\Endpoint\AuthClient;
use PhpList\RestApiClient\Endpoint\SubscribePagesClient;
use PhpList\RestApiClient\Exception\ApiException;
use PhpList\RestApiClient\Exception\ValidationException;
use PhpList\RestApiClient\Request\SubscribePage\PublicSubscriptionRequest;
use PhpList\WebFrontend\Service\LanguageService;
use PhpList\WebFrontend\Service\PublicSubscribeFormBuilder;
use PhpList\WebFrontend\Service\PublicSubscribeFormValidator;
use RuntimeException;
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
        private readonly LanguageService $languageService,
        private readonly PublicSubscribeFormBuilder $formBuilder,
        private readonly PublicSubscribeFormValidator $formValidator,
        private readonly ConfigProvider $config,
        #[Autowire('%app.show_unsubscribe_link%')]
        private readonly bool $showUnsubscribeLink = true,
    ) {
        parent::__construct($authClient);
    }

    #[Route('/unsubscribe/{pageId}', name: 'unsubscribe', requirements: ['pageId' => '\d+'], methods: ['GET', 'POST'])]
    public function unsubscribe(Request $request, int $pageId): Response
    {
        $page = $this->subscribePagesClient->getPublicSubscribePage($pageId);
        $pageData = $page->data;
        $languageFile = $pageData['language_file'] ?? 'english.inc';
        $languageTexts = $this->languageService->loadLanguageTexts(is_string($languageFile) ? $languageFile : null);

        $success = false;
        if ($request->isMethod('POST')) {
            $email = trim((string) $request->request->get('email'));

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw $this->createNotFoundException('Invalid email address.');
            }
            $this->subscribePagesClient->deletePublicSubscription($pageId, $email);
            $success = true;
        }

        return $this->render('@PhpListFrontend/public/unsubscribe.html.twig', [
            'page' => 'Unsubscribe Page',
            'page_id' => $pageId,
            'data' => $pageData,
            'success' => $success,
            'signature' => $this->config->getValue(ConfigOption::PoweredByImage),
            'language_texts' => $languageTexts,
        ]);
    }

    #[Route('/subscribe/images/{fileName}', name: 'sub_images', requirements: ['fileName' => '[A-Za-z0-9._-]+'])]
    #[Route('/subscribe/styles/{fileName}', name: 'sub_styles', requirements: ['fileName' => '[A-Za-z0-9._-]+'])]
    #[Route('/unsubscribe/images/{fileName}', name: 'unsub_images', requirements: ['fileName' => '[A-Za-z0-9._-]+'])]
    public function getImages(string $fileName): Response
    {
        $applicationRoot = (new ApplicationStructure())->getApplicationRoot();

        $baseDir = realpath($applicationRoot . '/public/build');

        if ($baseDir === false) {
            throw new RuntimeException('Build directory not found.');
        }

        $path = realpath($baseDir . DIRECTORY_SEPARATOR . $fileName);

        if ($path === false || !str_starts_with($path, $baseDir . DIRECTORY_SEPARATOR)) {
            throw $this->createNotFoundException();
        }

        return $this->file($path);
    }

    #[Route('/subscribe/{pageId}', name: 'subscribe', requirements: ['pageId' => '\d+'], methods: ['GET', 'POST'])]
    public function subscribe(Request $request, int $pageId): Response
    {
        $admin = $this->getAdmin();
        $page = $this->subscribePagesClient->getPublicSubscribePage($pageId);
        $pageData = $page->data;
        $isSubmitted = $request->isMethod('POST');

        $languageFile = $pageData['language_file'] ?? 'english.inc';
        $languageTexts = $this->languageService->loadLanguageTexts(is_string($languageFile) ? $languageFile : null);

        $htmlChoice = $this->formBuilder->normalizeHtmlChoice($pageData['htmlchoice'] ?? null);
        $emailDoubleEntry = strtolower($pageData['emaildoubleentry'] ?? '') === 'yes';

        $lists = $page->data['lists'];
        $availableListIds = array_map(static fn ($list): int => (int) $list['id'], $lists);

        $attributes = $this->formBuilder->buildAttributeConfig($pageData);
        $formData = $this->formBuilder->buildInitialFormData(
            request: $request,
            emailDoubleEntry: $emailDoubleEntry,
            htmlChoice: $htmlChoice,
            pageData: $pageData,
            availableListIds: $availableListIds,
            attributes: $attributes
        );

        $errorMessages = [];
        $successHtml = null;
        if ($isSubmitted) {
            $errorMessages = $this->formValidator->validateFormData(
                formData: $formData,
                emailDoubleEntry: $emailDoubleEntry,
                availableListIds: $availableListIds,
                attributes: $attributes
            );

            if ($errorMessages === []) {
                try {
                    foreach ($formData['selected_lists'] as $listId) {
                        $this->subscribePagesClient->createPublicSubscription(
                            pageId: $pageId,
                            request: new PublicSubscriptionRequest(
                                email: $formData['email'],
                                listId: $listId,
                                attributes: $attributes,
                            )
                        );
                    }

                    $successHtml = trim((string) ($pageData['thankyoupage'] ?? ''));
                } catch (ValidationException | ApiException $exception) {
                    $errorMessages[] = $exception->getMessage();
                }
            }
        }

        return $this->render('@PhpListFrontend/public/subscribe.html.twig', [
            'page' => $page,
            'page_id' => $pageId,
            'data' => $pageData,
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
            'success_html' => $successHtml,
            'signature' => $this->config->getValue(ConfigOption::PoweredByImage)
        ]);
    }
}
