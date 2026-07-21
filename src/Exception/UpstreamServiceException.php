<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Exception;

use RuntimeException;

/**
 * Thrown when a request to the phpList REST API fails for reasons outside the
 * caller's control (outage, network error, unexpected server response).
 *
 * Controllers map this to a 5xx status so upstream failures are not reported as
 * client (4xx) errors.
 */
final class UpstreamServiceException extends RuntimeException
{

}
