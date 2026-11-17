import { describe, it, expect, afterEach, vi } from 'vitest'
import { createAppI18n, readAvailableLocales, readLocale, loadMessages } from '../../../../../assets/vue/i18n'

describe('i18n', () => {
    afterEach(() => {
        document.body.innerHTML = ''
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

    describe('readLocale', () => {
        const available = { en: 'English', es: 'Español' }
        const docWithLang = (lang) => {
            const doc = document.implementation.createHTMLDocument('')
            if (lang !== null) {
                doc.documentElement.setAttribute('lang', lang)
            }
            return doc
        }

        it('uses the language the server rendered the page in', () => {
            expect(readLocale(docWithLang('es'), available)).toBe('es')
            expect(readLocale(docWithLang('ES'), available)).toBe('es')
        })

        it('defaults to English when missing or not offered', () => {
            expect(readLocale(docWithLang(null), available)).toBe('en')
            expect(readLocale(docWithLang('xx'), available)).toBe('en')
            expect(readLocale(docWithLang('es'), {})).toBe('en')
        })
    })

    describe('loadMessages', () => {
        it('fetches the catalogue of the language', async () => {
            const fetchFn = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ a: 'b' }) })

            await expect(loadMessages('es', fetchFn)).resolves.toEqual({ a: 'b' })
            expect(fetchFn).toHaveBeenCalledWith('/translations/es.json', expect.objectContaining({ credentials: 'same-origin' }))
        })

        it('returns no messages when the request fails', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => {})

            await expect(loadMessages('es', vi.fn().mockResolvedValue({ ok: false, status: 500 }))).resolves.toEqual({})
            await expect(loadMessages('es', vi.fn().mockRejectedValue(new Error('offline')))).resolves.toEqual({})
        })

        it('gives up with no messages when the request stalls', async () => {
            vi.spyOn(console, 'error').mockImplementation(() => {})
            const stalled = vi.fn(() => new Promise(() => {}))

            await expect(loadMessages('es', stalled, 20)).resolves.toEqual({})
            expect(stalled.mock.calls[0][1].signal.aborted).toBe(true)
        })
    })
})
