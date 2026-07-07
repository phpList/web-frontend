// SubscriberTable.spec.js

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SubscriberTable from '../../../../../../assets/vue/components/subscribers/SubscriberTable.vue'

const BaseIconStub = {
    name: 'BaseIcon',
    props: ['name'],
    template: '<span class="base-icon">{{ name }}</span>',
}

describe('SubscriberTable', () => {
    const createSubscribers = () => ([
        {
            id: 1,
            email: 'john@example.com',
            confirmed: true,
            blacklisted: false,
            listCount: 3,
            createdAt: '2025-01-01',
        },
        {
            id: 2,
            email: 'blocked@example.com',
            confirmed: false,
            blacklisted: true,
            listCount: 1,
            createdAt: '2025-01-02',
        },
    ])

    const createWrapper = (props = {}) =>
        mount(SubscriberTable, {
            props: {
                subscribers: createSubscribers(),
                ...props,
            },
            global: {
                stubs: {
                    BaseIcon: BaseIconStub,
                },
            },
        })

    it('renders subscriber emails', () => {
        const wrapper = createWrapper()

        expect(wrapper.text()).toContain('john@example.com')
        expect(wrapper.text()).toContain('blocked@example.com')
    })

    it('renders subscriber ids', () => {
        const wrapper = createWrapper()

        expect(wrapper.text()).toContain('1')
        expect(wrapper.text()).toContain('2')
    })

    it('renders list counts', () => {
        const wrapper = createWrapper()

        expect(wrapper.text()).toContain('3')
        expect(wrapper.text()).toContain('1')
    })

    it('renders created dates', () => {
        const wrapper = createWrapper()

        expect(wrapper.text()).toContain('2025-01-01')
        expect(wrapper.text()).toContain('2025-01-02')
    })

    it('renders confirmed status', () => {
        const wrapper = createWrapper()

        expect(wrapper.text()).toContain('Confirmed')
    })

    it('renders unconfirmed status', () => {
        const wrapper = createWrapper()

        expect(wrapper.text()).toContain('Unconfirmed')
    })

    it('renders blacklisted badge', () => {
        const wrapper = createWrapper()

        expect(wrapper.text()).toContain('Blacklisted')
    })

    it('does not render blacklisted badge for non-blacklisted subscriber', () => {
        const wrapper = createWrapper({
            subscribers: [
                {
                    id: 1,
                    email: 'john@example.com',
                    confirmed: true,
                    blacklisted: false,
                    listCount: 1,
                    createdAt: '2025-01-01',
                },
            ],
        })

        expect(wrapper.text()).not.toContain('Blacklisted')
    })

    it('emits view event from desktop button', async () => {
        const wrapper = createWrapper()

        const buttons = wrapper
            .findAll('button')
            .filter(btn => btn.text().includes('View'))

        await buttons[0].trigger('click')

        expect(wrapper.emitted('view')).toEqual([[1]])
    })

    it('renders mobile username portion of email', () => {
        const wrapper = createWrapper()

        expect(wrapper.text()).toContain('john')
        expect(wrapper.text()).toContain('blocked')
    })

    it('passes eye icon to view buttons', () => {
        const wrapper = createWrapper()

        const icons = wrapper.findAllComponents(BaseIconStub)

        expect(
            icons.some(icon => icon.props('name') === 'eye')
        ).toBe(true)
    })

    it('renders no table rows when subscribers is empty', () => {
        const wrapper = createWrapper({
            subscribers: [],
        })

        expect(
            wrapper.findAll('tbody tr')
        ).toHaveLength(0)
    })
})
