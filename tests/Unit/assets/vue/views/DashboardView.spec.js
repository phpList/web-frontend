import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'

const statisticsClient = {
    getDashboardSummary: vi.fn(),
    getRecentCampaigns: vi.fn(),
}

const backendFetch = vi.fn()

vi.mock('../../../../../assets/vue/api', () => ({
    statisticsClient,
    backendFetch,
}))

vi.mock('../../../../../assets/vue/composables/useCurrentAdmin', () => ({
    useCurrentAdmin: () => ({ loadCurrentAdmin: vi.fn().mockResolvedValue(undefined) }),
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
        props: ['summary', 'loading', 'error'],
        template: '<div class="dashboard-block" :data-loading="loading" :data-error="error">{{ summary ? "summary-loaded" : "" }}</div>',
    }),
}))

vi.mock('../../../../../assets/vue/components/dashboard/HelpCard.vue', () => ({
    default: defineComponent({
        name: 'HelpCard',
        template: '<div class="dashboard-block" />',
    }),
}))

vi.mock('../../../../../assets/vue/components/dashboard/CommunityNewsCard.vue', () => ({
    default: defineComponent({
        name: 'CommunityNewsCard',
        props: ['items', 'loading', 'error'],
        template: '<div class="dashboard-block" :data-loading="loading" :data-error="error" />',
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
        props: ['rows', 'loading', 'error'],
        template: '<div class="dashboard-block" :data-loading="loading" :data-error="error" />',
    }),
}))

describe('DashboardView', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
        vi.clearAllMocks()
        vi.resetModules()
        backendFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ items: [{ title: 'News', link: 'https://www.phplist.org/newslist/a/' }] }),
        })
    })

    it('marks each section as loading independently, and clears loading once each resolves', async () => {
        let resolveSummary
        statisticsClient.getDashboardSummary.mockReturnValue(new Promise((resolve) => {
            resolveSummary = resolve
        }))
        statisticsClient.getRecentCampaigns.mockResolvedValue({
            campaigns: [{ name: 'Summer launch', status: 'sent', date: '2026-06-01', openRate: '60%', clickRate: '20%' }],
        })

        const { default: DashboardView } = await import('../../../../../assets/vue/views/DashboardView.vue')

        const wrapper = mount(DashboardView)
        await nextTick()

        expect(wrapper.findComponent({ name: 'KpiGrid' }).props('loading')).toBe(true)
        expect(wrapper.findComponent({ name: 'RecentCampaignsCard' }).props('loading')).toBe(true)

        await flushPromises()

        // Sections whose requests already resolved stop loading and show their data,
        // while the summary section (still pending) keeps its own spinner.
        expect(wrapper.findComponent({ name: 'RecentCampaignsCard' }).props('loading')).toBe(false)
        expect(wrapper.findComponent({ name: 'RecentCampaignsCard' }).props('rows')).toHaveLength(1)
        expect(wrapper.findComponent({ name: 'KpiGrid' }).props('loading')).toBe(true)

        resolveSummary({
            totalSubscribers: { value: 12345, changeVsLastMonth: 5.2 },
            activeCampaigns: { value: 42, changeVsLastMonth: -3.5 },
            openRate: { value: 28, changeVsLastMonth: 1.1 },
            bounceRate: { value: 4, changeVsLastMonth: -0.7 },
        })
        await flushPromises()

        expect(statisticsClient.getDashboardSummary).toHaveBeenCalled()
        expect(statisticsClient.getRecentCampaigns).toHaveBeenCalled()
        expect(wrapper.findComponent({ name: 'KpiGrid' }).props('loading')).toBe(false)
        expect(wrapper.findComponent({ name: 'KpiGrid' }).text()).toContain('summary-loaded')
    })

    it('surfaces an error for the failing section only, without blocking the others', async () => {
        statisticsClient.getDashboardSummary.mockRejectedValue(new Error('Session expired'))
        statisticsClient.getRecentCampaigns.mockResolvedValue({ campaigns: [] })

        const { default: DashboardView } = await import('../../../../../assets/vue/views/DashboardView.vue')

        const wrapper = mount(DashboardView)

        await flushPromises()

        expect(wrapper.findComponent({ name: 'KpiGrid' }).props('error')).toBe('Unable to load dashboard summary.')
        expect(wrapper.findComponent({ name: 'RecentCampaignsCard' }).props('error')).toBe('')
    })

    it('does not re-fetch dashboard statistics when the view is remounted', async () => {
        statisticsClient.getDashboardSummary.mockResolvedValue({
            totalSubscribers: { value: 12345, changeVsLastMonth: 5.2 },
            activeCampaigns: { value: 42, changeVsLastMonth: -3.5 },
            openRate: { value: 28, changeVsLastMonth: 1.1 },
            bounceRate: { value: 4, changeVsLastMonth: -0.7 },
        })
        statisticsClient.getRecentCampaigns.mockResolvedValue({ campaigns: [] })

        const { default: DashboardView } = await import('../../../../../assets/vue/views/DashboardView.vue')

        const firstMount = mount(DashboardView)
        await flushPromises()
        firstMount.unmount()

        const secondMount = mount(DashboardView)
        await flushPromises()

        expect(statisticsClient.getDashboardSummary).toHaveBeenCalledTimes(1)
        expect(statisticsClient.getRecentCampaigns).toHaveBeenCalledTimes(1)
        expect(secondMount.findComponent({ name: 'KpiGrid' }).props('loading')).toBe(false)
        expect(secondMount.findComponent({ name: 'KpiGrid' }).props('error')).toBe('')
    })

    it('shows the help section and loads community news', async () => {
        statisticsClient.getDashboardSummary.mockResolvedValue({})
        statisticsClient.getRecentCampaigns.mockResolvedValue({ campaigns: [] })

        const { default: DashboardView } = await import('../../../../../assets/vue/views/DashboardView.vue')

        const wrapper = mount(DashboardView)
        expect(wrapper.findComponent({ name: 'CommunityNewsCard' }).props('loading')).toBe(true)
        await flushPromises()

        expect(wrapper.findComponent({ name: 'HelpCard' }).exists()).toBe(true)
        expect(backendFetch).toHaveBeenCalledWith('/dashboard/community-news', expect.anything())
        const news = wrapper.findComponent({ name: 'CommunityNewsCard' })
        expect(news.props('loading')).toBe(false)
        expect(news.props('items')).toHaveLength(1)
    })
})
