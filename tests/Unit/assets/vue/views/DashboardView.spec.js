import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

const statisticsClient = {
    getDashboardSummary: vi.fn(),
    getRecentCampaigns: vi.fn(),
    getCampaignPerformance: vi.fn(),
}

vi.mock('../../../../../assets/vue/api', () => ({
    statisticsClient,
}))

vi.mock('../../../../../assets/vue/layouts/AdminLayout.vue', () => ({
    default: defineComponent({
        name: 'AdminLayout',
        template: '<div class="admin-layout"><slot /></div>',
    }),
}))

vi.mock('../../../../../assets/vue/components/dashboard/KpiGrid.vue', () => ({
    default: defineComponent({
        name: 'KpiGrid',
        props: ['summary'],
        template: '<div class="dashboard-block" />',
    }),
}))

vi.mock('../../../../../assets/vue/components/dashboard/PerformanceChartCard.vue', () => ({
    default: defineComponent({
        name: 'PerformanceChartCard',
        props: ['chart'],
        template: '<div class="dashboard-block" />',
    }),
}))

vi.mock('../../../../../assets/vue/components/dashboard/QuickActionsCard.vue', () => ({
    default: defineComponent({
        name: 'QuickActionsCard',
        template: '<div class="dashboard-block" />',
    }),
}))

vi.mock('../../../../../assets/vue/components/dashboard/RecentCampaignsCard.vue', () => ({
    default: defineComponent({
        name: 'RecentCampaignsCard',
        props: ['rows'],
        template: '<div class="dashboard-block" />',
    }),
}))

describe('DashboardView', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
        vi.clearAllMocks()
    })

    it('loads dashboard statistics from the statistics client on mount', async () => {
        statisticsClient.getDashboardSummary.mockResolvedValue({
            totalSubscribers: { value: 12345, changeVsLastMonth: 5.2 },
            activeCampaigns: { value: 42, changeVsLastMonth: -3.5 },
            openRate: { value: 28, changeVsLastMonth: 1.1 },
            bounceRate: { value: 4, changeVsLastMonth: -0.7 },
        })
        statisticsClient.getRecentCampaigns.mockResolvedValue({
            campaigns: [{ name: 'Summer launch', status: 'sent', date: '2026-06-01', openRate: '60%', clickRate: '20%' }],
        })
        statisticsClient.getCampaignPerformance.mockResolvedValue({
            points: [{ date: '2026-06-01', opens: 10, clicks: 3 }],
        })

        vi.resetModules()

        const { default: DashboardView } = await import('../../../../../assets/vue/views/DashboardView.vue')

        const wrapper = mount(DashboardView)

        await flushPromises()

        expect(statisticsClient.getDashboardSummary).toHaveBeenCalled()
        expect(statisticsClient.getRecentCampaigns).toHaveBeenCalled()
        expect(statisticsClient.getCampaignPerformance).toHaveBeenCalled()
        expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })

    it('renders an error banner when loading dashboard statistics fails', async () => {
        statisticsClient.getDashboardSummary.mockRejectedValue(new Error('Session expired'))
        statisticsClient.getRecentCampaigns.mockResolvedValue({ campaigns: [] })
        statisticsClient.getCampaignPerformance.mockResolvedValue({ points: [] })

        vi.resetModules()

        const { default: DashboardView } = await import('../../../../../assets/vue/views/DashboardView.vue')

        const wrapper = mount(DashboardView)

        await flushPromises()

        expect(wrapper.text()).toContain('Unable to load dashboard statistics.')
        expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    })
})