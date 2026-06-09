import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QuickActionsCard from './QuickActionsCard.vue'

const BaseCardStub = {
    name: 'BaseCard',
    template: '<div class="base-card"><slot /></div>',
}

describe('QuickActionsCard', () => {
    const mountComponent = () =>
        mount(QuickActionsCard, {
            global: {
                stubs: {
                    BaseCard: BaseCardStub,
                },
            },
        })

    it('renders the card title', () => {
        const wrapper = mountComponent()

        expect(wrapper.text()).toContain('Quick Actions')
    })

    it('renders all quick action links', () => {
        const wrapper = mountComponent()

        const actions = wrapper.findAll('a')

        expect(actions).toHaveLength(4)
    })

    it('renders the expected labels', () => {
        const wrapper = mountComponent()

        const labels = wrapper
            .findAll('a')
            .map((link) => link.text().trim())

        expect(labels).toEqual([
            'New Campaign',
            'Add Subscribers',
            'Import List',
            'Manage Templates',
        ])
    })

    it('renders the expected href values', () => {
        const wrapper = mountComponent()

        const links = wrapper.findAll('a')

        expect(links[0].attributes('href')).toBe('/campaigns/create')
        expect(links[1].attributes('href')).toBe('/subscribers')
        expect(links[2].attributes('href')).toBe('/lists')
        expect(links[3].attributes('href')).toBe('/templates')
    })

    it('renders one icon per action', () => {
        const wrapper = mountComponent()

        const icons = wrapper.findAll('svg')

        expect(icons).toHaveLength(4)
    })

    it('renders actions in the expected order', () => {
        const wrapper = mountComponent()

        const links = wrapper.findAll('a')

        expect(links[0].text()).toContain('New Campaign')
        expect(links[1].text()).toContain('Add Subscribers')
        expect(links[2].text()).toContain('Import List')
        expect(links[3].text()).toContain('Manage Templates')
    })

    it('applies the expected styling classes to action links', () => {
        const wrapper = mountComponent()

        const firstAction = wrapper.find('a')

        expect(firstAction.classes()).toContain('rounded-xl')
        expect(firstAction.classes()).toContain('border')
        expect(firstAction.classes()).toContain('hover:bg-gray-100')
    })
})
