<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Service;

class ListSelectionService
{
    public function __construct(
        private readonly FormDataMapper $formDataMapper,
    ) {
    }

    /**
     * @param string|array<int,mixed>|null $rawListIds
     * @return list<int>
     */
    public function parseAvailableListIds(string|array|null $rawListIds): array
    {
        return $this->formDataMapper->parseNumericIds($rawListIds);
    }

    /**
     * @param list<int> $selectedLists
     * @param list<int> $availableListIds
     */
    public function validateSelection(array $selectedLists, array $availableListIds): ?string
    {
        if ($selectedLists === []) {
            return 'error.select_newsletter';
        }

        $allowedListLookup = array_fill_keys($availableListIds, true);
        foreach ($selectedLists as $selectedListId) {
            if (!isset($allowedListLookup[$selectedListId])) {
                return 'error.invalid_selected_lists';
            }
        }

        return null;
    }
}
