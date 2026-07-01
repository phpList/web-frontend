import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

vi.mock('../../../../../assets/vue/layouts/AdminLayout.vue', () => ({
    default: defineComponent({
        name: 'AdminLayout',
        template: '<div class="admin-layout"><slot /></div>',
    }),
}))

vi.mock('../../../../../assets/vue/components/dashboard/KpiGrid.vue', () => ({
    default: defineComponent({
        name: 'KpiGrid',
        template: '<div class="dashboard-block" />',
    }),
}))

vi.mock('../../../../../assets/vue/components/dashboard/PerformanceChartCard.vue', () => ({
    default: defineComponent({
        name: 'PerformanceChartCard',
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
        template: '<div class="dashboard-block" />',
    }),
}))

describe('DashboardView', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
    })

    it('renders the dashboard error banner when provided by the server', async () => {
        document.body.innerHTML = `
      <div
        id="vue-app"
        data-dashboard-stats="{}"
        data-dashboard-error="Session expired"
      ></div>
    `

        vi.resetModules()

        const { default: DashboardView } = await import('../../../../../assets/vue/views/DashboardView.vue')

        const wrapper = mount(DashboardView)

        expect(wrapper.text()).toContain('Session expired')
        expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    })
})
