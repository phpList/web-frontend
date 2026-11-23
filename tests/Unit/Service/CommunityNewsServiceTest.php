<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\Service;

use PhpList\WebFrontend\Service\CommunityNewsService;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Cache\Adapter\ArrayAdapter;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;

class CommunityNewsServiceTest extends TestCase
{
    private function feed(int $count, string $extraItem = ''): string
    {
        $items = '';
        for ($index = 1; $index <= $count; $index++) {
            $items .=
                '<item>' . "\n" .
                '  <title>Article ' . $index . ' &amp; more</title>' . "\n" .
                '  <link>https://www.phplist.org/newslist/article-' . $index . '/</link>' . "\n" .
                '  <pubDate>Tue, 27 Oct 2026 09:44:35 +0000</pubDate>' . "\n" .
                '  <description><![CDATA[<p>Summary of <b>article</b> ' . $index . '.</p>]]></description>' . "\n" .
                '</item>' . "\n";
        }

        return '<?xml version="1.0"?><rss version="2.0"><channel><title>x</title>' . $items . $extraItem
            . '</channel></rss>';
    }

    public function testReturnsLatestItemsLimitedAndCleaned(): void
    {
        $service = new CommunityNewsService(new ArrayAdapter(), new MockHttpClient(new MockResponse($this->feed(5))));

        $items = $service->getLatest(3);

        self::assertCount(3, $items);
        self::assertSame('Article 1 & more', $items[0]['title']);
        self::assertSame('https://www.phplist.org/newslist/article-1/', $items[0]['link']);
        self::assertSame('Summary of article 1.', $items[0]['summary']);
        self::assertSame('2026-10-27T09:44:35+00:00', $items[0]['date']);
    }

    public function testSkipsItemsWithUnsafeLinks(): void
    {
        $bad = '<item><title>Bad</title><link>javascript:alert(1)</link></item>';
        $service = new CommunityNewsService(
            new ArrayAdapter(),
            new MockHttpClient(new MockResponse($this->feed(1, $bad)))
        );

        $items = $service->getLatest(3);

        self::assertCount(1, $items);
        self::assertSame('Article 1 & more', $items[0]['title']);
    }

    public function testTruncatesLongSummaries(): void
    {
        $long = '<item><title>Long</title><link>https://example.org/a</link><description>'
            . str_repeat('word ', 100) . '</description></item>';
        $service = new CommunityNewsService(
            new ArrayAdapter(),
            new MockHttpClient(new MockResponse('<rss><channel>' . $long . '</channel></rss>'))
        );

        $summary = $service->getLatest(1)[0]['summary'];

        self::assertLessThanOrEqual(161, mb_strlen($summary));
        self::assertStringEndsWith('…', $summary);
    }

    public function testReturnsEmptyListWhenFeedIsUnavailable(): void
    {
        $service = new CommunityNewsService(
            new ArrayAdapter(),
            new MockHttpClient(new MockResponse('', ['http_code' => 500]))
        );

        self::assertSame([], $service->getLatest(3));
    }

    public function testReturnsEmptyListWhenFeedIsNotXml(): void
    {
        $service = new CommunityNewsService(
            new ArrayAdapter(),
            new MockHttpClient(new MockResponse('<html>not a feed</html>'))
        );

        self::assertSame([], $service->getLatest(3));
    }

    public function testCachesTheFeedBetweenCalls(): void
    {
        $requests = 0;
        $client = new MockHttpClient(function () use (&$requests): MockResponse {
            $requests++;

            return new MockResponse($this->feed(2));
        });
        $service = new CommunityNewsService(new ArrayAdapter(), $client);

        $service->getLatest(3);
        $service->getLatest(3);

        self::assertSame(1, $requests);
    }
}
