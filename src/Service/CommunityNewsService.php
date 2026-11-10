<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Service;

use DateTimeImmutable;
use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;
use RuntimeException;
use SimpleXMLElement;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Contracts\Cache\CacheInterface;
use Symfony\Contracts\Cache\ItemInterface;
use Symfony\Contracts\HttpClient\Exception\ClientExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\RedirectionExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\ServerExceptionInterface;
use Symfony\Contracts\HttpClient\Exception\TransportExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;
use Throwable;

/**
 * Fetches the latest phpList community articles from the public RSS feed.
 *
 * The request is made server side because www.phplist.org does not send CORS headers,
 * so the browser cannot read the feed directly.
 */
class CommunityNewsService
{
    public const FEED_URL = 'https://www.phplist.org/newslist/feed/';
    private const CACHE_KEY = 'community_news_feed';
    private const CACHE_TTL = 3600;
    private const FAILURE_TTL = 300;
    private const SUMMARY_LENGTH = 160;

    private HttpClientInterface $httpClient;
    private LoggerInterface $logger;

    public function __construct(
        private readonly CacheInterface $cache,
        ?HttpClientInterface $httpClient = null,
        ?LoggerInterface $logger = null,
    ) {
        $this->httpClient = $httpClient ?? HttpClient::create(['timeout' => 5]);
        $this->logger = $logger ?? new NullLogger();
    }

    /**
     * @return array<int, array{title: string, link: string, date: string|null, summary: string}>
     */
    public function getLatest(int $limit = 3): array
    {
        $items = $this->cache->get(self::CACHE_KEY, function (ItemInterface $item): array {
            try {
                $items = $this->fetch();
                $item->expiresAfter(self::CACHE_TTL);

                return $items;
            } catch (Throwable $exception) {
                $this->logger->warning('Unable to load phpList community news: ' . $exception->getMessage());
                // Cache the failure briefly so a down feed does not slow down every dashboard load.
                $item->expiresAfter(self::FAILURE_TTL);

                return [];
            }
        });

        return array_slice($items, 0, max(0, $limit));
    }

    /**
     * @return array<int, array{title: string, link: string, date: string|null, summary: string}>
     * @throws ClientExceptionInterface|RedirectionExceptionInterface|ServerExceptionInterface|TransportExceptionInterface|RuntimeException
     */
    private function fetch(): array
    {
        $response = $this->httpClient->request('GET', self::FEED_URL, [
            'headers' => ['Accept' => 'application/rss+xml, application/xml;q=0.9'],
        ]);
        $previous = libxml_use_internal_errors(true);

        try {
            $xml = simplexml_load_string($response->getContent(), SimpleXMLElement::class, LIBXML_NONET);
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
        }

        if ($xml === false || !isset($xml->channel->item)) {
            throw new RuntimeException('Unexpected feed format.');
        }

        $items = [];
        foreach ($xml->channel->item as $entry) {
            $link = trim((string) $entry->link);
            $title = trim((string) $entry->title);
            if ($title === '' || !preg_match('#^https?://#i', $link)) {
                continue;
            }

            $items[] = [
                'title' => html_entity_decode($title, ENT_QUOTES | ENT_HTML5),
                'link' => $link,
                'date' => $this->parseDate((string) $entry->pubDate),
                'summary' => $this->summarize((string) $entry->description),
            ];
        }

        return $items;
    }

    private function parseDate(string $value): ?string
    {
        try {
            return $value === '' ? null : (new DateTimeImmutable($value))->format(DATE_ATOM);
        } catch (Throwable) {
            return null;
        }
    }

    private function summarize(string $html): string
    {
        $text = trim(preg_replace('/\s+/u', ' ', html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5)) ?? '');

        if (mb_strlen($text) <= self::SUMMARY_LENGTH) {
            return $text;
        }

        return rtrim(mb_substr($text, 0, self::SUMMARY_LENGTH), ' ,.;:-') . '…';
    }
}
