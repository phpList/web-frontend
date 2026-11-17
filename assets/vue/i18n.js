import { createI18n } from 'vue-i18n'
import IntlMessageFormat from 'intl-messageformat'

/**
 * Admin UI translations.
 *
 * The single source of truth is translations/frontend+intl-icu.<locale>.xlf (Symfony).
 * The server embeds the catalogue for the current locale (already merged with the English
 * fallback) into spa.html.twig as JSON, and sets <html lang>. Messages use ICU MessageFormat,
 * so Twig (`|trans`) and Vue (`t()`) share one syntax:
 *
 *   XLIFF target: {count, plural, one {# subscriber} other {# subscribers}}
 *   Vue:          t(key, { count: 3 })      Twig: key|trans({count: 3})
 */

export const DEFAULT_LOCALE = 'en'
const MESSAGES_ELEMENT_ID = 'i18n-messages'
const LOCALES_ELEMENT_ID = 'i18n-locales'
export const LOCALE_QUERY_PARAM = '_locale'

/**
 * vue-i18n message compiler that formats messages with ICU MessageFormat instead of
 * vue-i18n's own syntax. Compiled formatters are cached by vue-i18n per message.
 */
export function icuMessageCompiler(message, { locale, key, onError }) {
    if (typeof message !== 'string') {
        onError?.(new Error(`Unsupported message for key "${key}": only ICU strings are supported`))
        return () => key
    }

    let formatter
    try {
        formatter = new IntlMessageFormat(message, locale)
    } catch (error) {
        onError?.(error)
        return () => message
    }

    return (ctx) => {
        const result = formatter.format(ctx.values)
        return Array.isArray(result) ? result.join('') : result
    }
}

export function readLocale(doc = document) {
    return doc.documentElement.getAttribute('lang') || DEFAULT_LOCALE
}

export function readMessages(doc = document) {
    const element = doc.getElementById(MESSAGES_ELEMENT_ID)
    if (!element) {
        return {}
    }

    try {
        return JSON.parse(element.textContent || '{}')
    } catch {
        return {}
    }
}

/** Languages offered by the language selector, as { code: nativeName }. */
export function readAvailableLocales(doc = document) {
    try {
        return JSON.parse(doc.getElementById(LOCALES_ELEMENT_ID)?.textContent || '{}') || {}
    } catch {
        return {}
    }
}

/**
 * URL of the current page in another language. The server stores the choice in the session,
 * so the parameter is only needed for this one navigation.
 */
export function localeUrl(locale, href = window.location.href) {
    const url = new URL(href)
    url.searchParams.set(LOCALE_QUERY_PARAM, locale)
    return url.pathname + url.search + url.hash
}

/** Removes `?_locale=` from the address bar once the server has applied (and remembered) it. */
export function stripLocaleParam(win = window) {
    const url = new URL(win.location.href)
    if (url.searchParams.has(LOCALE_QUERY_PARAM)) {
        url.searchParams.delete(LOCALE_QUERY_PARAM)
        win.history.replaceState(win.history.state, '', url.pathname + url.search + url.hash)
    }
}

export function createAppI18n({ locale = readLocale(), messages = readMessages() } = {}) {
    return createI18n({
        legacy: false,
        locale,
        // The server has already merged the English fallback into `messages`,
        // so there is no second catalogue to fall back to on the client.
        fallbackLocale: locale,
        messages: { [locale]: messages },
        messageCompiler: icuMessageCompiler,
        missingWarn: process.env.NODE_ENV !== 'production',
        fallbackWarn: false,
    })
}