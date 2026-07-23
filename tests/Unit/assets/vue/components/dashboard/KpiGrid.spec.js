// KpiGrid.spec.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('./KpiCard.vue', () => ({
    default: {
        name: 'KpiCard',
        props: [
            'id',
            'label',
            'value',
            'change',
            'trend',
            'icon',
        ],
        template: '<div class="kpi-card">{{ label }}</div>',
    },
}))

const createDashboardStats = () => ({
    total_subscribers: {
        value: 12345,
        change_vs_last_month: 5.2,
    },
    active_campaigns: {
        value: 42,
        change_vs_last_month: -3.5,
    },
    open_rate: {
        value: 28,
        change_vs_last_month: 1.1,
    },
    bounce_rate: {
        value: 4,
        change_vs_last_month: -0.7,
    },
})

describe('KpiGrid', () => {
    beforeEach(() => {
        document.body.innerHTML = `
      <div
        id="vue-app"
        data-dashboard-stats='${JSON.stringify(createDashboardStats())}'
      ></div>
    `
    })

    it('renders four KPI cards', async () => {
        const { default: KpiGrid } = await import('../../../../../../assets/vue/components/dashboard/KpiGrid.vue')

        const wrapper = mount(KpiGrid)

        const cards = wrapper.findAllComponents({ name: 'KpiCard' })

        expect(cards).toHaveLength(4)
    })

    it('passes formatted props to KPI cards', async () => {
        const { default: KpiGrid } = await import('../../../../../../assets/vue/components/dashboard/KpiGrid.vue')

        const wrapper = mount(KpiGrid)

        const cards = wrapper.findAllComponents({ name: 'KpiCard' })

        expect(cards[0].props()).toEqual({
            id: 'subscribers',
            label: 'Total Subscribers',
            value: '12,345',
            change: '+5.2%',
            trend: 'up',
            icon: 'users',
        })

        expect(cards[1].props()).toEqual({
            id: 'campaigns',
            label: 'Active Campaigns',
            value: '42',
            change: '-3.5%',
            trend: 'down',
            icon: 'plane',
        })

        expect(cards[2].props()).toEqual({
            id: 'open-rate',
            label: 'Open Rate',
            value: '28%',
            change: '+1.1%',
            trend: 'up',
            icon: 'rate',
        })

        expect(cards[3].props()).toEqual({
            id: 'bounce-rate',
            label: 'Bounce Rate',
            value: '4%',
            change: '-0.7%',
            trend: 'down',
            icon: 'warning',
        })
    })

    it('falls back to zero values when dashboard stats are missing', async () => {
        document.body.innerHTML = `
      <div id="vue-app" data-dashboard-stats="{}"></div>
    `

        vi.resetModules()

        const { default: KpiGrid } = await import('../../../../../../assets/vue/components/dashboard/KpiGrid.vue')

        const wrapper = mount(KpiGrid)

        const cards = wrapper.findAllComponents({ name: 'KpiCard' })

        expect(cards[0].props().value).toBe('0')
        expect(cards[0].props().change).toBe('0.0%')
        expect(cards[0].props().trend).toBe('up')
    })

    it('handles invalid JSON in dashboard stats', async () => {
        document.body.innerHTML = `
      <div id="vue-app" data-dashboard-stats="invalid-json"></div>
    `

        vi.resetModules()

        const { default: KpiGrid } = await import('../../../../../../assets/vue/components/dashboard/KpiGrid.vue')

        const wrapper = mount(KpiGrid)

        const cards = wrapper.findAllComponents({ name: 'KpiCard' })

        expect(cards).toHaveLength(4)
        expect(cards[0].props().value).toBe('0')
    })
})
