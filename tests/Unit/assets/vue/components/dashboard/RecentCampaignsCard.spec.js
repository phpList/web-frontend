// RecentCampaignsCard.spec.js

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import RecentCampaignsCard from '../../../../../../assets/vue/components/dashboard/RecentCampaignsCard.vue'

vi.mock('../../../../../../assets/vue/components/dashboard/CampaignsTable.vue', () => ({
    default: {
        name: 'CampaignsTable',
        props: ['rows'],
        template: '<div class="campaigns-table-stub" />',
    },
}))

const BaseCardStub = {
    name: 'BaseCard',
    template: '<div class="base-card"><slot /></div>',
}

describe('RecentCampaignsCard', () => {
    const sampleRows = [
        {
            id: 1,
            name: 'Summer Sale',
            status: 'Sent',
        },
        {
            id: 2,
            name: 'Newsletter',
            status: 'Draft',
        },
    ]

    const mountComponent = (props = {}) =>
        mount(RecentCampaignsCard, {
            props,
            global: {
                stubs: {
                    BaseCard: BaseCardStub,
                },
            },
        })

    it('renders the card title', () => {
        const wrapper = mountComponent()

        expect(wrapper.text()).toContain('Recent Campaigns')
    })

    it('passes rows to CampaignsTable', () => {
        const wrapper = mountComponent({
            rows: sampleRows,
        })

        const table = wrapper.findComponent({
            name: 'CampaignsTable',
        })

        expect(table.props('rows')).toEqual(sampleRows)
    })

    it('uses an empty array by default', () => {
        const wrapper = mountComponent()

        const table = wrapper.findComponent({
            name: 'CampaignsTable',
        })

        expect(table.props('rows')).toEqual([])
    })

    it('renders the table container', () => {
        const wrapper = mountComponent()

        expect(wrapper.find('.overflow-x-auto').exists()).toBe(true)
    })

    it('updates rows when props change', async () => {
        const wrapper = mountComponent({
            rows: [],
        })

        const updatedRows = [
            {
                id: 123,
                name: 'Black Friday',
            },
        ]

        await wrapper.setProps({
            rows: updatedRows,
        })

        const table = wrapper.findComponent({
            name: 'CampaignsTable',
        })

        expect(table.props('rows')).toEqual(updatedRows)
    })
})
