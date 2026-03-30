<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Service;

use PhpList\RestApiClient\Request\Subscriber\ExportSubscriberRequest;
use Symfony\Component\HttpFoundation\ParameterBag;

class SubscriberExportRequestFactory
{
    public function fromQuery(ParameterBag $query): ExportSubscriberRequest
    {
        return new ExportSubscriberRequest(
            dateType: (string) $query->get('date_type', 'any'),
            listId: $query->has('list_id') ? $query->getInt('list_id') : null,
            dateFrom: $query->get('date_from') ?: null,
            dateTo: $query->get('date_to') ?: null,
            columns: array_values(array_filter($query->all('columns'))),
            isConfirmed: $query->has('confirmed') ? true :
                ($query->has('unconfirmed') ? false : null),
            isBlacklisted: $query->has('blacklisted') ? true :
                ($query->has('non-blacklisted') ? false : null),
        );
    }
}
