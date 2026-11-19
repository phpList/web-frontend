// Guards the translation catalogues in translations/frontend+intl-icu.<locale>.xlf:
// valid ICU syntax, no stray keys in other languages, matching placeholders,
// and every key referenced from Vue/Twig actually exists in English.
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { parse, TYPE } from '@formatjs/icu-messageformat-parser'
import { availableLocales, loadXliffMessages } from '../support/xliff'

const ROOT = process.cwd()
const SOURCE_LOCALE = 'en'

const listFiles = (dir, extensions) =>
    readdirSync(dir).flatMap((entry) => {
        const full = path.join(dir, entry)
        if (statSync(full).isDirectory()) {
            return listFiles(full, extensions)
        }
        return extensions.some((ext) => entry.endsWith(ext)) ? [full] : []
    })

const collectKeys = (files, patterns) => {
    const keys = new Map()
    for (const file of files) {
        const source = readFileSync(file, 'utf8')
        for (const pattern of patterns) {
            for (const match of source.matchAll(pattern)) {
                keys.set(match[1], path.relative(ROOT, file))
            }
        }
    }
    return keys
}

const argumentNames = (message) => {
    const names = new Set()
    const walk = (elements) => {
        for (const element of elements) {
            if (element.type !== TYPE.literal && element.type !== TYPE.pound && element.value) {
                names.add(element.value)
            }
            for (const option of Object.values(element.options || {})) {
                walk(option.value)
            }
            if (element.children) {
                walk(element.children)
            }
        }
    }
    walk(parse(message))
    return [...names].sort()
}

const source = loadXliffMessages(SOURCE_LOCALE)

describe('frontend translation catalogues', () => {
    const locales = availableLocales()

    it('include the source locale', () => {
        expect(locales).toContain(SOURCE_LOCALE)
    })

    it.each(locales)('%s: every message is valid ICU MessageFormat', (locale) => {
        for (const [key, message] of Object.entries(loadXliffMessages(locale))) {
            expect(() => parse(message), `${locale}: ${key}`).not.toThrow()
        }
    })

    it.each(locales.filter((l) => l !== SOURCE_LOCALE))('%s: only contains keys that exist in English', (locale) => {
        const unknown = Object.keys(loadXliffMessages(locale)).filter((key) => !(key in source))
        expect(unknown).toEqual([])
    })

    it.each(locales.filter((l) => l !== SOURCE_LOCALE))('%s: uses the same placeholders as English', (locale) => {
        for (const [key, message] of Object.entries(loadXliffMessages(locale))) {
            if (key in source) {
                expect(argumentNames(message), `${locale}: ${key}`).toEqual(argumentNames(source[key]))
            }
        }
    })

    it('defines every key used in Vue components', () => {
        const used = collectKeys(listFiles(path.join(ROOT, 'assets'), ['.vue', '.js']), [
            /\bt\(\s*['"]([\w.-]+)['"]/g,
            /\blabelKey:\s*['"]([\w.-]+)['"]/g,
        ])
        const missing = [...used].filter(([key]) => !(key in source)).map(([key, file]) => `${key} (${file})`)
        expect(missing).toEqual([])
    })

    it('defines every key used in Twig templates of the frontend domain', () => {
        const templates = listFiles(path.join(ROOT, 'templates'), ['.twig'])
            .filter((file) => readFileSync(file, 'utf8').includes("trans_default_domain 'frontend'"))
        const used = collectKeys(templates, [/'([\w.-]+)'\s*\|\s*trans\b/g])
        const missing = [...used].filter(([key]) => !(key in source)).map(([key, file]) => `${key} (${file})`)
        expect(missing).toEqual([])
    })
})