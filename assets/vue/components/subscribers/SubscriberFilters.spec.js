// SubscriberFilters.spec.js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SubscriberFilters from './SubscriberFilters.vue'
import { subscriberFilters } from './subscriberFilters'

describe('SubscriberFilters', () => {
    const createWrapper = () =>
        mount(SubscriberFilters)

    it('renders all filters', () => {
        const wrapper = createWrapper()

        const buttons = wrapper.findAll('button')

        expect(buttons).toHaveLength(
            subscriberFilters.length
        )
    })

    it('renders filter labels', () => {
        const wrapper = createWrapper()

        subscriberFilters.forEach(filter => {
            expect(wrapper.text())
                .toContain(filter.label)
        })
    })

    it('starts with "all" selected', () => {
        const wrapper = createWrapper()

        const allFilter = subscriberFilters.find(
            filter => filter.id === 'all'
        )

        const button = wrapper
            .findAll('button')
            .find(btn =>
                btn.text().includes(allFilter.label)
            )

        expect(button.classes())
            .toContain('bg-ext-wf2')

        expect(button.classes())
            .toContain('text-ext-wf1')
    })

    it('emits selected filter when clicked', async () => {
        const wrapper = createWrapper()

        const targetFilter = subscriberFilters.find(
            filter => filter.id !== 'all'
        )

        const button = wrapper
            .findAll('button')
            .find(btn =>
                btn.text().includes(targetFilter.label)
            )

        await button.trigger('click')

        expect(
            wrapper.emitted('filter-change')
        ).toEqual([
            [targetFilter.id],
        ])
    })

    it('changes active filter styling', async () => {
        const wrapper = createWrapper()

        const targetFilter = subscriberFilters.find(
            filter => filter.id !== 'all'
        )

        const button = wrapper
            .findAll('button')
            .find(btn =>
                btn.text().includes(targetFilter.label)
            )

        await button.trigger('click')

        expect(button.classes())
            .toContain('bg-ext-wf2')

        expect(button.classes())
            .toContain('text-ext-wf1')
    })

    it('removes active filter when clicked twice', async () => {
        const wrapper = createWrapper()

        const targetFilter = subscriberFilters.find(
            filter => filter.id !== 'all'
        )

        const button = wrapper
            .findAll('button')
            .find(btn =>
                btn.text().includes(targetFilter.label)
            )

        await button.trigger('click')
        await button.trigger('click')

        expect(
            wrapper.emitted('filter-change')
        ).toEqual([
            [targetFilter.id],
            [null],
        ])
    })

    it('switches between filters', async () => {
        const wrapper = createWrapper()

        const buttons = wrapper.findAll('button')

        expect(buttons.length).toBeGreaterThan(2)

        await buttons[1].trigger('click')
        await buttons[2].trigger('click')

        const emissions =
            wrapper.emitted('filter-change')

        expect(emissions[0]).toEqual([
            subscriberFilters[1].id,
        ])

        expect(emissions[1]).toEqual([
            subscriberFilters[2].id,
        ])
    })

    it('only keeps one filter active at a time', async () => {
        const wrapper = createWrapper()

        const buttons = wrapper.findAll('button')

        expect(buttons.length).toBeGreaterThan(2)

        await buttons[1].trigger('click')

        expect(buttons[1].classes())
            .toContain('bg-ext-wf2')

        await buttons[2].trigger('click')

        expect(buttons[2].classes())
            .toContain('bg-ext-wf2')

        expect(buttons[1].classes())
            .not.toContain('bg-ext-wf2')
    })
})
