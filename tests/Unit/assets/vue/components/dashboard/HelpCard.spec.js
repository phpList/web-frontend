import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HelpCard from '../../../../../../assets/vue/components/dashboard/HelpCard.vue'

const BaseCardStub = {
    name: 'BaseCard',
    template: '<div class="base-card"><slot /></div>',
}

describe('HelpCard', () => {
    const mountComponent = () =>
        mount(HelpCard, { global: { stubs: { BaseCard: BaseCardStub } } })

    it('links to the useful manual pages', () => {
        const hrefs = mountComponent().findAll('a').map((link) => link.attributes('href'))

        expect(hrefs).toEqual([
            'https://www.phplist.org/manual/books/phplist-manual/page/composing-your-first-campaign',
            // 'https://www.phplist.org/manual/books/phplist-manual/page/basic-campaign-statistics',
            'https://www.phplist.org/manual/books/phplist-manual/page/system-overview',
            'https://discuss.phplist.org/latest',
        ])
    })

    it('opens links in a new tab without leaking the opener', () => {
        mountComponent().findAll('a').forEach((link) => {
            expect(link.attributes('target')).toBe('_blank')
            expect(link.attributes('rel')).toContain('noopener')
        })
    })
})
