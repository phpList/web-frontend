// useDarkMode.spec.js

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useDarkMode } from '../../../../../assets/vue/composables/useDarkMode'

const setMatchMedia = (matches) => {
    window.matchMedia = vi.fn().mockReturnValue({ matches })
}

describe('useDarkMode', () => {
    beforeEach(() => {
        localStorage.clear()
        document.documentElement.classList.remove('dark')
        setMatchMedia(false)
    })

    afterEach(() => {
        document.documentElement.classList.remove('dark')
    })

    it('starts with dark mode disabled and no dark class', () => {
        const { isDark, initDarkMode } = useDarkMode()
        initDarkMode()

        expect(isDark.value).toBe(false)
        expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('initializes from system preference when nothing is stored', () => {
        setMatchMedia(true)

        const { isDark, initDarkMode } = useDarkMode()
        initDarkMode()

        expect(isDark.value).toBe(true)
        expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('initializes as light when system preference is light and nothing is stored', () => {
        setMatchMedia(false)

        const { isDark, initDarkMode } = useDarkMode()
        initDarkMode()

        expect(isDark.value).toBe(false)
        expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('prefers the stored value over system preference', () => {
        localStorage.setItem('color-scheme', 'dark')
        setMatchMedia(false)

        const { isDark, initDarkMode } = useDarkMode()
        initDarkMode()

        expect(isDark.value).toBe(true)
        expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('restores light mode from storage even if system prefers dark', () => {
        localStorage.setItem('color-scheme', 'light')
        setMatchMedia(true)

        const { isDark, initDarkMode } = useDarkMode()
        initDarkMode()

        expect(isDark.value).toBe(false)
        expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('toggles dark mode on and persists the choice', () => {
        const { isDark, initDarkMode, toggleDarkMode } = useDarkMode()
        initDarkMode()

        toggleDarkMode()

        expect(isDark.value).toBe(true)
        expect(document.documentElement.classList.contains('dark')).toBe(true)
        expect(localStorage.getItem('color-scheme')).toBe('dark')
    })

    it('toggles dark mode off and persists the choice', () => {
        localStorage.setItem('color-scheme', 'dark')

        const { isDark, initDarkMode, toggleDarkMode } = useDarkMode()
        initDarkMode()

        toggleDarkMode()

        expect(isDark.value).toBe(false)
        expect(document.documentElement.classList.contains('dark')).toBe(false)
        expect(localStorage.getItem('color-scheme')).toBe('light')
    })

    it('shares state across multiple useDarkMode() calls', () => {
        const first = useDarkMode()
        const second = useDarkMode()

        first.toggleDarkMode()

        expect(second.isDark.value).toBe(first.isDark.value)
    })
})