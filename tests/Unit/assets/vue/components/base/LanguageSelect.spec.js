import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { backendFetch } from '../../../../../../assets/vue/api'
import LanguageSelect from '../../../../../../assets/vue/components/base/LanguageSelect.vue'
import { createAppI18n } from '../../../../../../assets/vue/i18n'

const setLocales = (locales) => {
    document.body.innerHTML = locales
        ? `<script type="application/json" id="i18n-locales">${JSON.stringify(locales)}</script>`
        : ''
}

vi.mock('../../../../../../assets/vue/api', () => ({ backendFetch: vi.fn() }))

describe('LanguageSelect', () => {
    afterEach(() => {
        vi.clearAllMocks()
        document.body.innerHTML = ''
        document.documentElement.removeAttribute('lang')
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    it('lists the languages offered by the server, named in their own language', () => {
        setLocales({ en: 'English', es: 'Español' })

        const wrapper = mount(LanguageSelect)
        const options = wrapper.findAll('option')

        expect(options.map((o) => o.attributes('value'))).toEqual(['en', 'es'])
        expect(options.map((o) => o.text())).toEqual(['English', 'Español'])
        expect(wrapper.find('select').element.value).toBe('en')
        expect(wrapper.find('label').text()).toBe('Language')
    })

    it('is hidden when there is nothing to choose from', () => {
        setLocales({ en: 'English' })
        expect(mount(LanguageSelect).find('select').exists()).toBe(false)

        setLocales(null)
        expect(mount(LanguageSelect).find('select').exists()).toBe(false)
    })

    it('switches the language in place and asks the server to remember it', async () => {
        setLocales({ en: 'English', es: 'Español' })
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ 'language.label': 'Idioma' }),
        }))
        backendFetch.mockResolvedValue({ ok: true })
        const i18n = createAppI18n({ locale: 'en', messages: { 'language.label': 'Language' } })

        const wrapper = mount(LanguageSelect, { global: { plugins: [i18n] } })
        await wrapper.find('select').setValue('es')
        await flushPromises()

        expect(fetch).toHaveBeenCalledWith('/translations/es.json', expect.anything())
        expect(i18n.global.locale.value).toBe('es')
        expect(wrapper.find('label').text()).toBe('Idioma')
        expect(document.documentElement.getAttribute('lang')).toBe('es')
        expect(backendFetch).toHaveBeenCalledWith('/locale', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ locale: 'es' }),
        }))
    })

    it('still switches when saving the choice fails', async () => {
        setLocales({ en: 'English', es: 'Español' })
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }))
        backendFetch.mockResolvedValue({ ok: false, status: 500 })
        vi.spyOn(console, 'error').mockImplementation(() => {})
        const i18n = createAppI18n({ locale: 'en', messages: {} })

        const wrapper = mount(LanguageSelect, { global: { plugins: [i18n] } })
        await wrapper.find('select').setValue('es')
        await flushPromises()

        expect(i18n.global.locale.value).toBe('es')
        expect(console.error).toHaveBeenCalled()
    })

    it('does nothing when the current language is picked again', async () => {
        setLocales({ en: 'English', es: 'Español' })
        vi.stubGlobal('fetch', vi.fn())

        await mount(LanguageSelect).find('select').setValue('en')

        expect(fetch).not.toHaveBeenCalled()
        expect(backendFetch).not.toHaveBeenCalled()
    })

    it('ignores a slow earlier switch when the active language is picked again', async () => {
        setLocales({ en: 'English', es: 'Español' })
        let resolveEs
        vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => { resolveEs = resolve })))
        backendFetch.mockResolvedValue({ ok: true })
        const i18n = createAppI18n({ locale: 'en', messages: { 'language.label': 'Language' } })

        const wrapper = mount(LanguageSelect, { global: { plugins: [i18n] } })
        await wrapper.find('select').setValue('es')
        await wrapper.find('select').setValue('en')
        resolveEs({ ok: true, json: async () => ({ 'language.label': 'Idioma' }) })
        await flushPromises()

        expect(i18n.global.locale.value).toBe('en')
        expect(document.documentElement.getAttribute('lang')).not.toBe('es')
        expect(backendFetch).not.toHaveBeenCalled()
    })

    it('lets the newest choice win over an older pending one and works again afterwards', async () => {
        setLocales({ en: 'English', es: 'Español', fr: 'Français' })
        const pending = {}
        vi.stubGlobal('fetch', vi.fn((url) => new Promise((resolve) => { pending[url] = resolve })))
        backendFetch.mockResolvedValue({ ok: true })
        const i18n = createAppI18n({ locale: 'en', messages: {} })

        const wrapper = mount(LanguageSelect, { global: { plugins: [i18n] } })
        await wrapper.find('select').setValue('es')
        await wrapper.find('select').setValue('fr')
        pending['/translations/fr.json']({ ok: true, json: async () => ({}) })
        await flushPromises()
        pending['/translations/es.json']({ ok: true, json: async () => ({}) })
        await flushPromises()

        expect(i18n.global.locale.value).toBe('fr')
        expect(backendFetch).toHaveBeenCalledTimes(1)
        expect(backendFetch.mock.calls[0][1].body).toBe(JSON.stringify({ locale: 'fr' }))

        await wrapper.find('select').setValue('en')
        pending['/translations/en.json']({ ok: true, json: async () => ({}) })
        await flushPromises()
        expect(i18n.global.locale.value).toBe('en')
    })

    it('keeps the current language and does not save when the catalogue fails to load', async () => {
        setLocales({ en: 'English', es: 'Español' })
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
        vi.spyOn(console, 'error').mockImplementation(() => {})
        const i18n = createAppI18n({ locale: 'en', messages: { 'language.label': 'Language' } })

        const wrapper = mount(LanguageSelect, { global: { plugins: [i18n] } })
        await wrapper.find('select').setValue('es')
        await flushPromises()

        expect(i18n.global.locale.value).toBe('en')
        expect(i18n.global.getLocaleMessage('en')).toEqual({ 'language.label': 'Language' })
        expect(i18n.global.getLocaleMessage('es')).toEqual({})
        expect(wrapper.find('select').element.value).toBe('en')
        expect(backendFetch).not.toHaveBeenCalled()
    })
})
