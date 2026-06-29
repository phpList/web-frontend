import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

const layoutStub = {
    name: 'AdminLayout',
    template: '<div class="admin-layout"><slot /></div>',
}

const blockStub = {
    name: 'DashboardBlock',
    template: '<div class="dashboard-block" />',
}

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

        const { default: DashboardView } = await import('./DashboardView.vue')

        const wrapper = mount(DashboardView, {
            global: {
                stubs: {
                    AdminLayout: layoutStub,
                    KpiGrid: blockStub,
                    PerformanceChartCard: blockStub,
                    QuickActionsCard: blockStub,
                    RecentCampaignsCard: blockStub,
                },
            },
        })

        expect(wrapper.text()).toContain('Session expired')
        expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    })
})
