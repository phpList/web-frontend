import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import StuckCampaignsList from '../../../../../../assets/vue/components/campaigns/StuckCampaignsList.vue'
import { campaignClient } from '../../../../../../assets/vue/api'

vi.mock('../../../../../../assets/vue/api', () => ({
    campaignClient: {
        getStuckCampaigns: vi.fn(),
        resumeCampaign: vi.fn(),
    },
}))

vi.mock('../../../../../../assets/vue/components/base/BaseIcon.vue', () => ({
    default: { template: '<span />', props: ['name'] },
}))

const makeStuckCampaign = (overrides = {}) => ({
    id: 1,
    subject: 'Stuck Newsletter',
    status: 'inprocess',
    updatedAt: '2024-03-01T10:00:00Z',
    stuckSeconds: 2700,
    ...overrides,
})

const mountComponent = () =>
    mount(StuckCampaignsList, {
        global: {
            stubs: { RouterLink: { template: '<a><slot /></a>' } },
        },
    })

describe('StuckCampaignsList', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('loads and renders stuck campaigns on mount', async () => {
        campaignClient.getStuckCampaigns.mockResolvedValue({ items: [makeStuckCampaign()] })

        const wrapper = mountComponent()
        await flushPromises()

        expect(campaignClient.getStuckCampaigns).toHaveBeenCalledTimes(1)
        expect(wrapper.text()).toContain('Stuck Newsletter')
        expect(wrapper.text()).toContain('45m')
    })

    it('shows an empty state when there are no stuck campaigns', async () => {
        campaignClient.getStuckCampaigns.mockResolvedValue({ items: [] })

        const wrapper = mountComponent()
        await flushPromises()

        expect(wrapper.text()).toContain('No stuck campaigns right now.')
    })

    it('shows an error message when loading fails', async () => {
        campaignClient.getStuckCampaigns.mockRejectedValue(new Error('Network error'))

        const wrapper = mountComponent()
        await flushPromises()

        expect(wrapper.text()).toContain('Network error')
    })

    it('resumes a campaign and refreshes the list', async () => {
        vi.useFakeTimers()
        campaignClient.getStuckCampaigns.mockResolvedValue({ items: [makeStuckCampaign()] })
        campaignClient.resumeCampaign.mockResolvedValue({})

        const wrapper = mountComponent()
        await flushPromises()

        const resumeButton = wrapper.findAll('button').find((btn) => btn.text().includes('Resume'))
        await resumeButton.trigger('click')
        await flushPromises()

        expect(campaignClient.resumeCampaign).toHaveBeenCalledWith(1)
        expect(wrapper.text()).toContain('Campaign resumed.')

        vi.runAllTimers()
        await flushPromises()

        expect(campaignClient.getStuckCampaigns).toHaveBeenCalledTimes(2)
        vi.useRealTimers()
    })
})