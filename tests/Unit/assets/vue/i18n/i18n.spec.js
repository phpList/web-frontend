import { describe, it, expect, afterEach, vi } from 'vitest'
import { createAppI18n, readLocale, readMessages, readAvailableLocales, localeUrl, stripLocaleParam } from '../../../../../assets/vue/i18n'

describe('i18n', () => {
    afterEach(() => {
        document.documentElement.removeAttribute('lang')
        document.body.innerHTML = ''
    })

    it('reads the locale from <html lang>, defaulting to English', () => {
        expect(readLocale()).toBe('en')

        document.documentElement.setAttribute('lang', 'es')
        expect(readLocale()).toBe('es')
    })

    it('reads the messages embedded by the server', () => {
        document.body.innerHTML =
            '<script type="application/json" id="i18n-messages">{"sidebar.nav.lists":"Listas"}</script>'

        expect(readMessages()).toEqual({ 'sidebar.nav.lists': 'Listas' })
    })

    it('returns no messages when the embedded JSON is missing or invalid', () => {
        expect(readMessages()).toEqual({})

        document.body.innerHTML = '<script type="application/json" id="i18n-messages">{oops</script>'
        expect(readMessages()).toEqual({})
    })

    it('formats ICU placeholders and plurals with flat dotted keys', () => {
        const { global } = createAppI18n({
            locale: 'en',
            messages: {
                'greeting.hello': 'Hello {name}!',
                'subscribers.count': '{count, plural, =0 {No subscribers} one {# subscriber} other {# subscribers}}',
                'quote.literal': "Use '{'braces'}' and don't panic",
            },
        })

        expect(global.t('greeting.hello', { name: 'Ana' })).toBe('Hello Ana!')
        expect(global.t('subscribers.count', { count: 0 })).toBe('No subscribers')
        expect(global.t('subscribers.count', { count: 1 })).toBe('1 subscriber')
        expect(global.t('subscribers.count', { count: 1200 })).toBe('1,200 subscribers')
        expect(global.t('quote.literal')).toBe("Use {braces} and don't panic")
    })

    it('uses locale-specific plural rules and number formatting', () => {
        const { global } = createAppI18n({
            locale: 'es',
            messages: { 'subscribers.count': '{count, plural, one {# suscriptor} other {# suscriptores}}' },
        })

        expect(global.t('subscribers.count', { count: 1 })).toBe('1 suscriptor')
        expect(global.t('subscribers.count', { count: 12000 })).toBe('12.000 suscriptores')
    })

    it('falls back to the key for unknown messages', () => {
        const { global } = createAppI18n({ locale: 'en', messages: {} })

        expect(global.t('does.not.exist')).toBe('does.not.exist')
    })

    it('reads the languages offered by the server', () => {
        expect(readAvailableLocales()).toEqual({})

        document.body.innerHTML =
            '<script type="application/json" id="i18n-locales">{"en":"English","es":"Español"}</script>'
        expect(readAvailableLocales()).toEqual({ en: 'English', es: 'Español' })
    })

    it('builds a same-page URL in another language, keeping query and hash', () => {
        expect(localeUrl('es', 'http://x.test/lists?page=2#a')).toBe('/lists?page=2&_locale=es#a')
        expect(localeUrl('es', 'http://x.test/?_locale=en')).toBe('/?_locale=es')
    })

    it('removes the locale parameter from the address bar', () => {
        const replaceState = vi.fn()
        const win = { location: { href: 'http://x.test/lists?page=2&_locale=es#a' }, history: { state: { s: 1 }, replaceState } }

        stripLocaleParam(win)
        expect(replaceState).toHaveBeenCalledWith({ s: 1 }, '', '/lists?page=2#a')

        replaceState.mockClear()
        win.location.href = 'http://x.test/lists'
        stripLocaleParam(win)
        expect(replaceState).not.toHaveBeenCalled()
    })
})
