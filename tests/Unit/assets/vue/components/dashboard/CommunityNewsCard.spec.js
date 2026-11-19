import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CommunityNewsCard from '../../../../../../assets/vue/components/dashboard/CommunityNewsCard.vue'

const BaseCardStub = {
    name: 'BaseCard',
    template: '<div class="base-card"><slot /></div>',
}

describe('CommunityNewsCard', () => {
    const items = [
        { title: 'Docker update', link: 'https://www.phplist.org/newslist/docker/', date: '2026-10-27T09:44:35+00:00', summary: 'New images.' },
        { title: 'Release 4.0', link: 'https://www.phplist.org/newslist/release/', date: null, summary: '' },
    ]

    const mountComponent = (props = {}) =>
        mount(CommunityNewsCard, { props, global: { stubs: { BaseCard: BaseCardStub } } })

    it('renders each news item as an external link', () => {
        const wrapper = mountComponent({ items })
        const links = wrapper.findAll('li a')

        expect(links).toHaveLength(2)
        expect(links[0].attributes('href')).toBe('https://www.phplist.org/newslist/docker/')
        expect(links[0].attributes('target')).toBe('_blank')
        expect(links[0].attributes('rel')).toContain('noopener')
        expect(links[0].text()).toContain('Docker update')
        expect(links[0].text()).toContain('New images.')
        expect(links[0].text()).toContain('2026')
    })

    it('tolerates items without a date or summary', () => {
        const wrapper = mountComponent({ items })

        expect(wrapper.findAll('li a')[1].text()).toBe('Release 4.0')
    })

    it('shows a spinner while loading', () => {
        const wrapper = mountComponent({ loading: true, items })

        expect(wrapper.find('.animate-spin').exists()).toBe(true)
        expect(wrapper.findAll('li')).toHaveLength(0)
    })

    it('shows the error message', () => {
        const wrapper = mountComponent({ error: 'Unable to load community news.' })

        expect(wrapper.find('[role="alert"]').text()).toBe('Unable to load community news.')
    })

    it('shows an empty state when there are no items', () => {
        const wrapper = mountComponent({ items: [] })

        expect(wrapper.text()).toContain('No news available right now.')
    })

    it('links to the full news list', () => {
        const wrapper = mountComponent({ items: [] })

        expect(wrapper.find('header a').attributes('href')).toBe('https://www.phplist.org/newslist/')
    })
})
