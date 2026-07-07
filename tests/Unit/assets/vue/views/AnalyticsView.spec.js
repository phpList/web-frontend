import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

vi.mock('vue3-apexcharts', () => ({
  default: {
    name: 'VueApexCharts',
    template: '<div class="apexchart-stub" />',
  },
}))

const statisticsClient = {
  getCampaignStatistics: vi.fn(),
  getStatisticsOfViewOpens: vi.fn(),
  getTopDomains: vi.fn(),
  getDomainConfirmationStatistics: vi.fn(),
  getTopLocalParts: vi.fn(),
}

vi.mock('../../../../../assets/vue/api', () => ({
  statisticsClient,
}))

const layoutStub = {
  name: 'AdminLayout',
  template: '<div class="admin-layout"><slot /></div>',
}

describe('AnalyticsView', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('loads analytics data from the statistics client and renders summary cards', async () => {
    statisticsClient.getCampaignStatistics.mockResolvedValue({
      items: [
        {
          campaignId: 7,
          subject: 'Summer launch',
          dateSent: '2026-06-01',
          sent: 200,
          bounces: 4,
          uniqueViews: 120,
          totalClicks: 33,
        },
      ],
    })
    statisticsClient.getStatisticsOfViewOpens.mockResolvedValue({
      items: [
        {
          campaignId: 7,
          subject: 'Summer launch',
          sent: 200,
          uniqueViews: 120,
          rate: 60,
        },
      ],
    })
    statisticsClient.getTopDomains.mockResolvedValue({
      items: [{ domain: 'example.com', subscribers: 42 }],
    })
    statisticsClient.getDomainConfirmationStatistics.mockResolvedValue({
      domain: 'example.com',
      total: 100,
      confirmed: 80,
      unconfirmed: 20,
      confirmationRate: 80,
    })
    statisticsClient.getTopLocalParts.mockResolvedValue({
      items: [{ localPart: 'alex', count: 12, percentage: 24 }],
    })

    vi.resetModules()

    const { default: AnalyticsView } = await import('../../../../../assets/vue/views/AnalyticsView.vue')

    const wrapper = mount(AnalyticsView, {
      global: {
        stubs: {
          AdminLayout: layoutStub,
        },
      },
    })

    await flushPromises()

    expect(statisticsClient.getCampaignStatistics).toHaveBeenCalledWith(null, 100)
    expect(wrapper.text()).toContain('Campaigns tracked')
    expect(wrapper.text()).toContain('Summer launch')
    expect(wrapper.text()).toContain('example.com')
    expect(wrapper.text()).toContain('alex')
    expect(wrapper.text()).toContain('80.0%')
  })
})
