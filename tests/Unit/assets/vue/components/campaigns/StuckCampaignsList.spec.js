import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import StuckCampaignsList from '../../../../../../assets/vue/components/campaigns/StuckCampaignsList.vue'
import { getStuckCampaigns, resumeStuckCampaign } from '../../../../../../assets/vue/api'

vi.mock('../../../../../../assets/vue/api', () => ({
    getStuckCampaigns: vi.fn(),
    resumeStuckCampaign: vi.fn(),
}))

vi.mock('../../../../../../assets/vue/components/base/BaseIcon.vue', () => ({
    default: { template: '<span />', props: ['name'] },
}))

const makeStuckCampaign = (overrides = {}) => ({
    id: 1,
    subject: 'Stuck Newsletter',
    status: 'inprocess',
    updated_at: '2024-03-01T10:00:00Z',
    stuck_seconds: 2700,
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
        getStuckCampaigns.mockResolvedValue([makeStuckCampaign()])

        const wrapper = mountComponent()
        await flushPromises()

        expect(getStuckCampaigns).toHaveBeenCalledTimes(1)
        expect(wrapper.text()).toContain('Stuck Newsletter')
        expect(wrapper.text()).toContain('45m')
    })

    it('shows an empty state when there are no stuck campaigns', async () => {
        getStuckCampaigns.mockResolvedValue([])

        const wrapper = mountComponent()
        await flushPromises()

        expect(wrapper.text()).toContain('No stuck campaigns right now.')
    })

    it('shows an error message when loading fails', async () => {
        getStuckCampaigns.mockRejectedValue(new Error('Network error'))

        const wrapper = mountComponent()
        await flushPromises()

        expect(wrapper.text()).toContain('Network error')
    })

    it('resumes a campaign and refreshes the list', async () => {
        vi.useFakeTimers()
        getStuckCampaigns.mockResolvedValue([makeStuckCampaign()])
        resumeStuckCampaign.mockResolvedValue({})

        const wrapper = mountComponent()
        await flushPromises()

        const resumeButton = wrapper.findAll('button').find((btn) => btn.text().includes('Resume'))
        await resumeButton.trigger('click')
        await flushPromises()

        expect(resumeStuckCampaign).toHaveBeenCalledWith(1)
        expect(wrapper.text()).toContain('Campaign resumed.')

        vi.runAllTimers()
        await flushPromises()

        expect(getStuckCampaigns).toHaveBeenCalledTimes(2)
        vi.useRealTimers()
    })
})