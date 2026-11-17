import { describe, it, expect, afterEach } from 'vitest'
import { createAppI18n, readLocale, readMessages } from '../../../../../assets/vue/i18n'

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
})