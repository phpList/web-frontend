import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

// Vitest runs from the project root (where vitest.config.mjs lives).
export const TRANSLATIONS_DIR = path.resolve(process.cwd(), 'translations')
const FILE_PATTERN = /^frontend\+intl-icu\.([A-Za-z_]+)\.xlf$/

/** Locales that have a frontend catalogue, e.g. ['en', 'es']. */
export function availableLocales() {
    return readdirSync(TRANSLATIONS_DIR)
        .map((file) => file.match(FILE_PATTERN)?.[1])
        .filter(Boolean)
        .sort()
}

/** Parses translations/frontend+intl-icu.<locale>.xlf into a flat { key: message } map. */
export function loadXliffMessages(locale) {
    const file = path.join(TRANSLATIONS_DIR, `frontend+intl-icu.${locale}.xlf`)
    const doc = new DOMParser().parseFromString(readFileSync(file, 'utf8'), 'application/xml')

    const parseError = doc.getElementsByTagName('parsererror')[0]
    if (parseError) {
        throw new Error(`Invalid XLIFF in ${file}: ${parseError.textContent}`)
    }

    const messages = {}
    for (const unit of Array.from(doc.getElementsByTagName('trans-unit'))) {
        const key = unit.getAttribute('resname') || unit.getElementsByTagName('source')[0]?.textContent
        const target = unit.getElementsByTagName('target')[0]?.textContent
        if (key in messages) {
            throw new Error(`Duplicate key "${key}" in ${file}`)
        }
        messages[key] = target
    }

    return messages
}