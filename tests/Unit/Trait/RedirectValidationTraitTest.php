<?php

declare(strict_types=1);

namespace PhpList\WebFrontend\Tests\Unit\Trait;

use PhpList\WebFrontend\Trait\RedirectValidationTrait;
use PHPUnit\Framework\TestCase;

class RedirectValidationTraitTest extends TestCase
{
    private object $subject;

    protected function setUp(): void
    {
        $this->subject = new class {
            use RedirectValidationTrait;

            public function isSafe(string $target): bool
            {
                return $this->isSafeRedirectTarget($target);
            }
        };
    }

    /**
     * @dataProvider safeTargets
     */
    public function testAcceptsSameOriginPaths(string $target): void
    {
        $this->assertTrue($this->subject->isSafe($target));
    }

    /**
     * @dataProvider unsafeTargets
     */
    public function testRejectsAnythingThatCouldLeaveTheOrigin(string $target): void
    {
        $this->assertFalse($this->subject->isSafe($target));
    }

    /**
     * @return array<string, array{string}>
     */
    public static function safeTargets(): array
    {
        return [
            'simple path' => ['/campaigns'],
            'path with query' => ['/campaigns/42?tab=summary&x=1'],
            'front controller prefix' => ['/app.php/lists/5/subscribers'],
            'encoded backslash stays literal' => ['/a%5Cb'],
            'root' => ['/'],
        ];
    }

    /**
     * @return array<string, array{string}>
     */
    public static function unsafeTargets(): array
    {
        return [
            'backslash host (browsers read "/\\" as "//")' => ['/\\evil.com'],
            'backslash then slash' => ['/\\/evil.com'],
            'backslash deeper in path' => ['/ok/\\evil'],
            'tab between slashes' => ["/\t/evil.com"],
            'newline between slashes' => ["/\n/evil.com"],
            'carriage return' => ["/\r/evil.com"],
            'nul byte' => ["/\0/evil.com"],
            'scheme-relative' => ['//evil.com'],
            'absolute https' => ['https://evil.com'],
            'javascript scheme' => ['javascript:alert(1)'],
            'no leading slash' => ['evil.com'],
            'empty' => [''],
            'login page (loop)' => ['/login'],
            'login via front controller' => ['/app.php/login?x=1'],
        ];
    }
}
