import { createI18n } from 'vue-i18n'
import IntlMessageFormat from 'intl-messageformat'

/**
 * Admin UI translations.
 *
 * The single source of truth is translations/frontend+intl-icu.<locale>.xlf (Symfony).
 * The server decides the language of each page (the administrator's own choice, remembered in a
 * cookie; see LocalePreference) and renders it into <html lang>. The app fetches that language's
 * catalogue from /translations/<locale>.json (already merged with the English fallback), and
 * again whenever the header selector changes the language.
 * Messages use ICU MessageFormat, so Twig (`|trans`) and Vue (`t()`) share one syntax:
 *
 *   XLIFF target: {count, plural, one {# subscriber} other {# subscribers}}
 *   Vue:          t(key, { count: 3 })      Twig: key|trans({count: 3})
 */

export const DEFAULT_LOCALE = 'en'
const LOCALES_ELEMENT_ID = 'i18n-locales'

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

/** Languages offered by the language selector, as { code: nativeName }. */
export function readAvailableLocales(doc = document) {
    try {
        return JSON.parse(doc.getElementById(LOCALES_ELEMENT_ID)?.textContent || '{}') || {}
    } catch {
        return {}
    }
}

/** The language the server rendered the page in (<html lang>), English if missing or not offered. */
export function readLocale(doc = document, available = readAvailableLocales(doc)) {
    const lang = doc.documentElement.getAttribute('lang') || ''
    const code = Object.keys(available).find((locale) => locale.toLowerCase() === lang.toLowerCase())

    return code || DEFAULT_LOCALE
}

/** How long to wait for a catalogue before giving up, so a stalled request cannot block the app. */
export const LOAD_TIMEOUT_MS = 8000

/**
 * Fetches the catalogue ({ key: ICU message }) for a language.
 * Never rejects and never hangs: returns {} on failure or after `timeoutMs`, in which case
 * messages render as their keys until a later load succeeds.
 */
export async function loadMessages(locale, fetchFn = (...args) => window.fetch(...args), timeoutMs = LOAD_TIMEOUT_MS) {
    const controller = new AbortController()
    let timer
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => {
            controller.abort()
            reject(new Error(`timed out after ${timeoutMs}ms`))
        }, timeoutMs)
    })

    try {
        return await Promise.race([
            (async () => {
                const response = await fetchFn(`/translations/${encodeURIComponent(locale)}.json`, {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                    signal: controller.signal,
                })
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`)
                }
                return await response.json()
            })(),
            timeout,
        ])
    } catch (error) {
        console.error(`Failed to load "${locale}" translations:`, error)
        return {}
    } finally {
        clearTimeout(timer)
    }
}

export function createAppI18n({ locale = DEFAULT_LOCALE, messages = {} } = {}) {
    return createI18n({
        legacy: false,
        locale,
        // The server has already merged the English fallback into each catalogue,
        // so there is no second catalogue to fall back to on the client.
        fallbackLocale: false,
        messages: { [locale]: messages },
        messageCompiler: icuMessageCompiler,
        missingWarn: process.env.NODE_ENV !== 'production',
        fallbackWarn: false,
    })
}