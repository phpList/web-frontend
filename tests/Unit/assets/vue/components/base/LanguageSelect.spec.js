import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LanguageSelect from '../../../../../../assets/vue/components/base/LanguageSelect.vue'

const setLocales = (locales) => {
    document.body.innerHTML = locales
        ? `<script type="application/json" id="i18n-locales">${JSON.stringify(locales)}</script>`
        : ''
}

describe('LanguageSelect', () => {
    afterEach(() => {
        document.body.innerHTML = ''
        vi.restoreAllMocks()
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

    it('navigates to the current page with the chosen locale', async () => {
        setLocales({ en: 'English', es: 'Español' })
        const assign = vi.fn()
        vi.spyOn(window, 'location', 'get').mockReturnValue({
            href: 'http://localhost/subscribers?page=2#top',
            assign,
        })

        const wrapper = mount(LanguageSelect)
        await wrapper.find('select').setValue('es')

        expect(assign).toHaveBeenCalledWith('/subscribers?page=2&_locale=es#top')
    })

    it('does nothing when the current language is picked again', async () => {
        setLocales({ en: 'English', es: 'Español' })
        const assign = vi.fn()
        vi.spyOn(window, 'location', 'get').mockReturnValue({ href: 'http://localhost/', assign })

        await mount(LanguageSelect).find('select').setValue('en')

        expect(assign).not.toHaveBeenCalled()
    })
})
