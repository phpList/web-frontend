import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import CampaignDirectory from '../../../../../../assets/vue/components/campaigns/CampaignDirectory.vue'
import {
    campaignClient,
    fetchAllLists,
    listMessagesClient,
    statisticsClient,
} from '../../../../../../assets/vue/api'

vi.mock('../../../../../../assets/vue/api', () => ({
    campaignClient: {
        getCampaigns: vi.fn(),
        getCampaign: vi.fn(),
        updateCampaignStatus: vi.fn(),
        deleteCampaign: vi.fn(),
        copyCampaign: vi.fn(),
        resendCampaign: vi.fn(),
    },
    fetchAllLists: vi.fn(),
    listMessagesClient: { getListsByMessage: vi.fn() },
    statisticsClient: {
        getCampaignStatistics: vi.fn(),
        getStatisticsOfViewOpens: vi.fn(),
    },
}))

vi.mock('./ViewCampaignModal.vue', () => ({
    default: {
        template: '<div data-testid="view-campaign-modal" />',
        props: ['isViewModalOpen', 'campaign', 'isViewLoading', 'viewErrorMessage',
            'mailingLists', 'isResending', 'resendErrorMessage'],
        emits: ['close', 'resend'],
    },
}))

vi.mock('../base/BaseIcon.vue', () => ({
    default: { template: '<span />', props: ['name'] },
}))

const makeCampaign = (overrides = {}) => ({
    id: 1,
    messageContent: { subject: 'Test Campaign' },
    messageMetadata: {
        status: 'sent',
        entered: '2024-03-01T10:00:00Z',
        sent: '2024-03-01T10:05:00Z',
        sendStart: '2024-03-01T10:00:00Z',
        processed: 100,
        views: 40,
    },
    messageFormat: { sendFormat: 'html' },
    ...overrides,
})

const makePagedResponse = (items = [], hasMore = false, nextCursor = null, total = items.length) => ({
    items,
    pagination: { total, hasMore, nextCursor },
})

const makeStatsResponse = (items = []) => makePagedResponse(items)

const defaultStats = () => makeStatsResponse([
    { campaignId: 1, bounces: 2, sent: 100, uniqueViews: 10 },
])

// A minimal fake backend: filters by status, sorts by id, and paginates via after_id the same
// way the real server does. Lets tests drive multi-page/filtered scenarios realistically instead
// of hand-chaining mockResolvedValueOnce for every call.
const buildFakeCampaignServer = (campaigns) => (afterId, limit = 5, subject = null, status = null, sort = 'asc') => {
    let pool = campaigns
    if (status) {
        const statuses = status.split(',')
        pool = pool.filter((c) => statuses.includes(c.messageMetadata.status))
    }

    const sorted = [...pool].sort((a, b) => (sort === 'desc' ? b.id - a.id : a.id - b.id))
    const windowed = afterId == null
        ? sorted
        : sorted.filter((c) => (sort === 'desc' ? c.id < afterId : c.id > afterId))

    const page = windowed.slice(0, limit)
    const hasMore = windowed.length > limit
    const nextCursor = page.length > 0 ? page[page.length - 1].id : null

    return Promise.resolve(makePagedResponse(page, hasMore, nextCursor, sorted.length))
}

const manyCampaigns = (count, overrides = {}) => Array.from({ length: count }, (_, i) => makeCampaign({ id: i + 1, ...overrides }))

const makeRouter = async (query = {}) => {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/', component: { template: '<div />' } },
            { path: '/campaigns/:campaignId/edit', name: 'campaign-edit', component: { template: '<div />' } },
            { path: '/lists/:listId/subscribers', component: { template: '<div />' } },
        ],
    })
    await router.push({ path: '/', query })
    await router.isReady()
    return router
}

const mountComponent = async (query = {}) => {
    const router = await makeRouter(query)
    const wrapper = mount(CampaignDirectory, {
        global: { plugins: [router] },
    })
    await flushPromises()
    return { wrapper, router }
}

beforeEach(() => {
    vi.clearAllMocks()
    campaignClient.getCampaigns.mockResolvedValue(makePagedResponse([makeCampaign()]))
    campaignClient.getCampaign.mockResolvedValue(makeCampaign())
    campaignClient.updateCampaignStatus.mockResolvedValue({})
    campaignClient.deleteCampaign.mockResolvedValue({})
    campaignClient.copyCampaign.mockResolvedValue({})
    campaignClient.resendCampaign.mockResolvedValue({})
    fetchAllLists.mockResolvedValue([])
    listMessagesClient.getListsByMessage.mockResolvedValue(makePagedResponse([]))
    statisticsClient.getCampaignStatistics.mockResolvedValue(defaultStats())
    statisticsClient.getStatisticsOfViewOpens.mockResolvedValue(makeStatsResponse())
})

describe('loading state', () => {
    it('clears loading text after the API resolves', async () => {
        const { wrapper } = await mountComponent()
        expect(wrapper.text()).not.toContain('Loading campaigns...')
    })
})

describe('on mount', () => {
    it('fetches campaigns on mount', async () => {
        await mountComponent()
        expect(campaignClient.getCampaigns).toHaveBeenCalled()
    })

    it('fetches only page 1 on mount, not the full dataset', async () => {
        campaignClient.getCampaigns.mockImplementation(buildFakeCampaignServer(manyCampaigns(50)))
        await mountComponent()
        expect(campaignClient.getCampaigns).toHaveBeenCalledTimes(1)
    })

    it('requests campaigns newest-first with no status filter by default', async () => {
        await mountComponent()
        expect(campaignClient.getCampaigns).toHaveBeenCalledWith(null, 5, null, null, 'desc')
    })

    it('fetches mailing lists on mount', async () => {
        await mountComponent()
        expect(fetchAllLists).toHaveBeenCalledTimes(1)
    })

    it('renders a campaign row after load', async () => {
        const { wrapper } = await mountComponent()
        expect(wrapper.text()).toContain('Test Campaign')
    })

    it('shows empty state when no campaigns are returned', async () => {
        campaignClient.getCampaigns.mockResolvedValue(makePagedResponse([]))
        const { wrapper } = await mountComponent()
        expect(wrapper.text()).toContain('No campaigns for this filter.')
    })

    it('shows error message when getCampaigns rejects', async () => {
        campaignClient.getCampaigns.mockRejectedValue(new Error('Network error'))
        const { wrapper } = await mountComponent()
        expect(wrapper.text()).toContain('Failed to load campaigns.')
    })
})

describe('status filter', () => {
    const clickFilter = async (wrapper, label) => {
        const btn = wrapper.findAll('button[type="button"]').find((b) => b.text().trim() === label)
        await btn.trigger('click')
        await flushPromises()
    }

    it('renders all four filter options', async () => {
        const { wrapper } = await mountComponent()
        const labels = wrapper.findAll('button[type="button"]').map((b) => b.text().trim())
        expect(labels).toContain('All')
        expect(labels).toContain('Sent')
        expect(labels).toContain('Active')
        expect(labels).toContain('Draft')
    })

    it('defaults to All filter', async () => {
        const { wrapper } = await mountComponent()
        const allBtn = wrapper.findAll('button[type="button"]').find((b) => b.text().trim() === 'All')
        expect(allBtn.classes()).toContain('bg-white')
    })

    it('reads status from the query param', async () => {
        const { wrapper } = await mountComponent({ status: 'draft' })
        const draftBtn = wrapper.findAll('button[type="button"]').find((b) => b.text().trim() === 'Draft')
        expect(draftBtn.classes()).toContain('bg-white')
    })

    it('filters campaigns when Sent is clicked', async () => {
        campaignClient.getCampaigns.mockImplementation(buildFakeCampaignServer([
            makeCampaign({ id: 1 }),
            makeCampaign({ id: 2, messageContent: { subject: 'Draft Campaign' }, messageMetadata: { ...makeCampaign().messageMetadata, status: 'draft' } }),
        ]))
        const { wrapper } = await mountComponent()
        await clickFilter(wrapper, 'Sent')
        expect(wrapper.text()).toContain('Test Campaign')
        expect(wrapper.text()).not.toContain('Draft Campaign')
    })

    it('requests the grouped status list for the Active tab', async () => {
        const { wrapper } = await mountComponent()
        await clickFilter(wrapper, 'Active')
        expect(campaignClient.getCampaigns).toHaveBeenLastCalledWith(null, 5, null, 'submitted,prepared,inprocess', 'desc')
    })

    it('updates URL query param when filter is clicked', async () => {
        const { wrapper, router } = await mountComponent()
        await clickFilter(wrapper, 'Sent')
        expect(router.currentRoute.value.query.status).toBe('sent')
    })

    it('removes status from URL when All is selected', async () => {
        const { wrapper, router } = await mountComponent({ status: 'sent' })
        await clickFilter(wrapper, 'All')
        expect(router.currentRoute.value.query.status).toBeUndefined()
    })

    it('falls back to All for an unknown status query param', async () => {
        const { wrapper } = await mountComponent({ status: 'garbage' })
        const allBtn = wrapper.findAll('button[type="button"]').find((b) => b.text().trim() === 'All')
        expect(allBtn.classes()).toContain('bg-white')
    })

    it('resets to page 1 when filter changes', async () => {
        campaignClient.getCampaigns.mockImplementation(buildFakeCampaignServer(manyCampaigns(10)))
        const { wrapper, router } = await mountComponent()
        const [, nextBtn] = wrapper.findAll('button[type="button"]').slice(-2)
        await nextBtn.trigger('click')
        await flushPromises()
        expect(router.currentRoute.value.query.page).toBe('2')
        await clickFilter(wrapper, 'Sent')
        expect(router.currentRoute.value.query.page).toBeUndefined()
    })
})

describe('campaign normalisation', () => {
    it('falls back to "Campaign #1" when subject is missing', async () => {
        campaignClient.getCampaigns.mockResolvedValue(
            makePagedResponse([makeCampaign({ messageContent: {} })])
        )
        const { wrapper } = await mountComponent()
        expect(wrapper.text()).toContain('Campaign #1')
    })

    it('shows "No date" when entered date is missing', async () => {
        campaignClient.getCampaigns.mockResolvedValue(makePagedResponse([
            makeCampaign({ messageMetadata: { status: 'sent', entered: null, sent: null, sendStart: null, processed: 0, views: 0 } }),
        ]))
        const { wrapper } = await mountComponent()
        expect(wrapper.text()).toContain('No date')
    })

    it('shows "Not sent yet" when sendStart or sent is missing', async () => {
        campaignClient.getCampaigns.mockResolvedValue(makePagedResponse([
            makeCampaign({ messageMetadata: { status: 'sent', entered: '2024-01-01', sent: null, sendStart: null, processed: 0, views: 0 } }),
        ]))
        const { wrapper } = await mountComponent()
        expect(wrapper.text()).toContain('Not sent yet')
    })

    it('resolves active statuses to "Active" label', async () => {
        for (const status of ['submitted', 'inprocess']) {
            campaignClient.getCampaigns.mockResolvedValue(makePagedResponse([
                makeCampaign({ id: 1, messageMetadata: { ...makeCampaign().messageMetadata, status } }),
            ]))
            const { wrapper } = await mountComponent()
            expect(wrapper.text()).toContain('Active')
        }
    })

    it('shows raw status label for unknown status', async () => {
        campaignClient.getCampaigns.mockResolvedValue(makePagedResponse([
            makeCampaign({ messageMetadata: { ...makeCampaign().messageMetadata, status: 'weird_status' } }),
        ]))
        const { wrapper } = await mountComponent()
        expect(wrapper.text()).toContain('weird status')
    })

    it('separates processed counts into text and html based on sendFormat', async () => {
        campaignClient.getCampaigns.mockResolvedValue(makePagedResponse([
            makeCampaign({ messageFormat: { sendFormat: 'text' }, messageMetadata: { ...makeCampaign().messageMetadata, processed: 50 } }),
        ]))
        const { wrapper } = await mountComponent()
        const text = wrapper.text()
        expect(text).toContain('50') // processedText
    })
})

describe('status badge classes', () => {
    const mountWithStatus = async (status) => {
        campaignClient.getCampaigns.mockResolvedValue(makePagedResponse([
            makeCampaign({ messageMetadata: { ...makeCampaign().messageMetadata, status } }),
        ]))
        return mountComponent()
    }

    it('applies emerald classes for sent', async () => {
        const { wrapper } = await mountWithStatus('sent')
        expect(wrapper.find('span.bg-emerald-100').exists()).toBe(true)
    })

    it('applies blue classes for active statuses', async () => {
        const { wrapper } = await mountWithStatus('inprocess')
        expect(wrapper.find('span.bg-blue-100').exists()).toBe(true)
    })

    it('applies slate classes for draft', async () => {
        const { wrapper } = await mountWithStatus('draft')
        expect(wrapper.find('span.bg-slate-100').exists()).toBe(true)
    })

    it('applies amber classes for unknown status', async () => {
        const { wrapper } = await mountWithStatus('weird')
        expect(wrapper.find('span.bg-amber-100').exists()).toBe(true)
    })
})

describe('action button visibility', () => {
    const mountWithStatus = async (status) => {
        campaignClient.getCampaigns.mockResolvedValue(makePagedResponse([
            makeCampaign({ messageMetadata: { ...makeCampaign().messageMetadata, status } }),
        ]))
        return mountComponent()
    }

    it('shows Delete and Edit buttons for draft campaigns', async () => {
        const { wrapper } = await mountWithStatus('draft')
        expect(wrapper.text()).toContain('Delete')
        expect(wrapper.text()).toContain('Edit')
        expect(wrapper.text()).not.toContain('Suspend')
    })

    it('shows Suspend button for active campaigns', async () => {
        const { wrapper } = await mountWithStatus('inprocess')
        expect(wrapper.text()).toContain('Suspend')
        expect(wrapper.text()).not.toContain('Delete')
    })

    it('shows Requeue and Copy to draft buttons for sent campaigns', async () => {
        const { wrapper } = await mountWithStatus('sent')
        expect(wrapper.text()).toContain('Requeue')
        expect(wrapper.text()).toContain('Copy to draft')
    })

    it('always shows View button', async () => {
        for (const status of ['sent', 'draft', 'inprocess']) {
            const { wrapper } = await mountWithStatus(status)
            expect(wrapper.text()).toContain('View')
        }
    })
})

describe('action handlers', () => {
    it('handleSuspend calls updateCampaignStatus with "suspended"', async () => {
        campaignClient.getCampaigns.mockResolvedValue(makePagedResponse([
            makeCampaign({ messageMetadata: { ...makeCampaign().messageMetadata, status: 'inprocess' } }),
        ]))
        const { wrapper } = await mountComponent()
        const suspendBtn = wrapper.findAll('button[type="button"]').find((b) => b.text().includes('Suspend'))
        await suspendBtn.trigger('click')
        await flushPromises()
        expect(campaignClient.updateCampaignStatus).toHaveBeenCalledWith(1, 'suspended')
    })

    it('handleSuspend shows success feedback', async () => {
        campaignClient.getCampaigns.mockResolvedValue(makePagedResponse([
            makeCampaign({ messageMetadata: { ...makeCampaign().messageMetadata, status: 'inprocess' } }),
        ]))
        const { wrapper } = await mountComponent()
        const suspendBtn = wrapper.findAll('button[type="button"]').find((b) => b.text().includes('Suspend'))
        await suspendBtn.trigger('click')
        await flushPromises()
        expect(wrapper.text()).toContain('Campaign suspended.')
    })

    it('handleSuspend refetches the current page after success', async () => {
        campaignClient.getCampaigns.mockResolvedValue(makePagedResponse([
            makeCampaign({ messageMetadata: { ...makeCampaign().messageMetadata, status: 'inprocess' } }),
        ]))
        const { wrapper } = await mountComponent()
        const suspendBtn = wrapper.findAll('button[type="button"]').find((b) => b.text().includes('Suspend'))
        await suspendBtn.trigger('click')
        await flushPromises()
        expect(campaignClient.getCampaigns).toHaveBeenCalledTimes(2)
    })

    it('handleSuspend shows error feedback on failure', async () => {
        campaignClient.getCampaigns.mockResolvedValue(makePagedResponse([
            makeCampaign({ messageMetadata: { ...makeCampaign().messageMetadata, status: 'inprocess' } }),
        ]))
        campaignClient.updateCampaignStatus.mockRejectedValue(new Error('API error'))
        const { wrapper } = await mountComponent()
        const suspendBtn = wrapper.findAll('button[type="button"]').find((b) => b.text().includes('Suspend'))
        await suspendBtn.trigger('click')
        await flushPromises()
        expect(wrapper.text()).toContain('API error')
    })

    it('handleRequeue calls updateCampaignStatus with "submitted"', async () => {
        const { wrapper } = await mountComponent()
        const requeueBtn = wrapper.findAll('button[type="button"]').find((b) => b.text().includes('Requeue'))
        await requeueBtn.trigger('click')
        await flushPromises()
        expect(campaignClient.updateCampaignStatus).toHaveBeenCalledWith(1, 'submitted')
    })

    it('handleRequeue shows error feedback on failure', async () => {
        campaignClient.updateCampaignStatus.mockRejectedValue(new Error('Requeue failed'))
        const { wrapper } = await mountComponent()
        const requeueBtn = wrapper.findAll('button[type="button"]').find((b) => b.text().includes('Requeue'))
        await requeueBtn.trigger('click')
        await flushPromises()
        expect(wrapper.text()).toContain('Requeue failed')
    })

    it('handleDelete calls window.confirm and deleteCampaign on confirmation', async () => {
        campaignClient.getCampaigns.mockResolvedValue(makePagedResponse([
            makeCampaign({ messageMetadata: { ...makeCampaign().messageMetadata, status: 'draft' } }),
        ]))
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        const { wrapper } = await mountComponent()
        const deleteBtn = wrapper.findAll('button[type="button"]').find((b) => b.text().includes('Delete'))
        await deleteBtn.trigger('click')
        await flushPromises()
        expect(window.confirm).toHaveBeenCalled()
        expect(campaignClient.deleteCampaign).toHaveBeenCalledWith(1)
    })

    it('handleDelete does not delete if user cancels confirm', async () => {
        campaignClient.getCampaigns.mockResolvedValue(makePagedResponse([
            makeCampaign({ messageMetadata: { ...makeCampaign().messageMetadata, status: 'draft' } }),
        ]))
        vi.spyOn(window, 'confirm').mockReturnValue(false)
        const { wrapper } = await mountComponent()
        const deleteBtn = wrapper.findAll('button[type="button"]').find((b) => b.text().includes('Delete'))
        await deleteBtn.trigger('click')
        await flushPromises()
        expect(campaignClient.deleteCampaign).not.toHaveBeenCalled()
    })

    it('handleDelete shows success feedback after deletion', async () => {
        campaignClient.getCampaigns.mockResolvedValue(makePagedResponse([
            makeCampaign({ messageMetadata: { ...makeCampaign().messageMetadata, status: 'draft' } }),
        ]))
        vi.spyOn(window, 'confirm').mockReturnValue(true)
        const { wrapper } = await mountComponent()
        const deleteBtn = wrapper.findAll('button[type="button"]').find((b) => b.text().includes('Delete'))
        await deleteBtn.trigger('click')
        await flushPromises()
        expect(wrapper.text()).toContain('Campaign deleted.')
    })

    it('handleCopyToDraft calls copyCampaign and shows feedback', async () => {
        const { wrapper } = await mountComponent()
        const copyBtn = wrapper.findAll('button[type="button"]').find((b) => b.text().includes('Copy to draft'))
        await copyBtn.trigger('click')
        await flushPromises()
        expect(campaignClient.copyCampaign).toHaveBeenCalledWith(1)
        expect(wrapper.text()).toContain('Created draft copy')
    })

    it('handleCopyToDraft shows error feedback on failure', async () => {
        campaignClient.copyCampaign.mockRejectedValue(new Error('Copy failed'))
        const { wrapper } = await mountComponent()
        const copyBtn = wrapper.findAll('button[type="button"]').find((b) => b.text().includes('Copy to draft'))
        await copyBtn.trigger('click')
        await flushPromises()
        expect(wrapper.text()).toContain('Copy failed')
    })

    it('handleEdit navigates to campaign-edit route', async () => {
        campaignClient.getCampaigns.mockResolvedValue(makePagedResponse([
            makeCampaign({ messageMetadata: { ...makeCampaign().messageMetadata, status: 'draft' } }),
        ]))
        const { wrapper, router } = await mountComponent()
        const editBtn = wrapper.findAll('button[type="button"]').find((b) => b.text().includes('Edit'))
        await editBtn.trigger('click')
        await flushPromises()
        expect(router.currentRoute.value.name).toBe('campaign-edit')
        expect(router.currentRoute.value.params.campaignId).toBe('1')
    })

    it('prevents double-clicking an action while loading', async () => {
        let resolve
        campaignClient.updateCampaignStatus.mockReturnValue(new Promise((res) => { resolve = res }))
        const { wrapper } = await mountComponent()
        const requeueBtn = wrapper.findAll('button[type="button"]').find((b) => b.text().includes('Requeue'))
        await requeueBtn.trigger('click')
        await requeueBtn.trigger('click')
        resolve({})
        await flushPromises()
        expect(campaignClient.updateCampaignStatus).toHaveBeenCalledTimes(1)
    })
})

describe('view modal', () => {
    it('opens the view modal when View is clicked', async () => {
        const { wrapper } = await mountComponent()
        const viewBtn = wrapper.findAll('button[type="button"]').find((b) => b.text().includes('View'))
        await viewBtn.trigger('click')
        await flushPromises()
        expect(wrapper.findComponent({ name: 'ViewCampaignModal' }).exists() ||
            wrapper.find('[data-testid="view-campaign-modal"]').exists()).toBe(true)
    })

    it('calls getCampaign with the correct id when View is clicked', async () => {
        const { wrapper } = await mountComponent()
        const viewBtn = wrapper.findAll('button[type="button"]').find((b) => b.text().includes('View'))
        await viewBtn.trigger('click')
        await flushPromises()
        expect(campaignClient.getCampaign).toHaveBeenCalledWith(1)
    })
})

describe('pagination', () => {
    const getPrevBtn = (wrapper) => wrapper.findAll('button[type="button"]').at(-2)
    const getNextBtn = (wrapper) => wrapper.findAll('button[type="button"]').at(-1)

    it('disables Previous on first page', async () => {
        const { wrapper } = await mountComponent()
        expect(getPrevBtn(wrapper).element.disabled).toBe(true)
    })

    it('disables Next when all items fit on one page', async () => {
        const { wrapper } = await mountComponent()
        expect(getNextBtn(wrapper).element.disabled).toBe(true)
    })

    it('enables Next when there are more pages', async () => {
        campaignClient.getCampaigns.mockResolvedValue(
            makePagedResponse(manyCampaigns(5), true, 5, 6)
        )
        const { wrapper } = await mountComponent()
        expect(getNextBtn(wrapper).element.disabled).toBe(false)
    })

    it('shows correct range text', async () => {
        campaignClient.getCampaigns.mockResolvedValue(
            makePagedResponse(manyCampaigns(5), true, 5, 6)
        )
        const { wrapper } = await mountComponent()
        expect(wrapper.text()).toContain('1')
        expect(wrapper.text()).toContain('5')
        expect(wrapper.text()).toContain('6')
    })

    it('fetches one page at a time - not the whole dataset - when paging forward', async () => {
        campaignClient.getCampaigns
            .mockResolvedValueOnce(makePagedResponse(manyCampaigns(5), true, 5, 6))
            .mockResolvedValueOnce(makePagedResponse([makeCampaign({ id: 6, messageContent: { subject: 'Sixth' } })], false, 6, 6))
        const { wrapper } = await mountComponent()
        await getNextBtn(wrapper).trigger('click')
        await flushPromises()
        expect(campaignClient.getCampaigns).toHaveBeenCalledTimes(2)
        expect(wrapper.text()).toContain('Sixth')
    })

    it('uses the cursor returned by the previous page when fetching the next one', async () => {
        campaignClient.getCampaigns
            .mockResolvedValueOnce(makePagedResponse(manyCampaigns(5), true, 5, 6))
            .mockResolvedValueOnce(makePagedResponse([makeCampaign({ id: 6 })], false, 6, 6))
        const { wrapper } = await mountComponent()
        await getNextBtn(wrapper).trigger('click')
        await flushPromises()
        expect(campaignClient.getCampaigns).toHaveBeenLastCalledWith(5, 5, null, null, 'desc')
    })

    it('updates the URL page param when navigating', async () => {
        campaignClient.getCampaigns
            .mockResolvedValueOnce(makePagedResponse(manyCampaigns(5), true, 5, 6))
            .mockResolvedValueOnce(makePagedResponse([makeCampaign({ id: 6 })], false, 6, 6))
        const { wrapper, router } = await mountComponent()
        await getNextBtn(wrapper).trigger('click')
        await flushPromises()
        expect(router.currentRoute.value.query.page).toBe('2')
    })

    it('caches a previously visited page instead of refetching it', async () => {
        campaignClient.getCampaigns
            .mockResolvedValueOnce(makePagedResponse(manyCampaigns(5), true, 5, 6))
            .mockResolvedValueOnce(makePagedResponse([makeCampaign({ id: 6 })], false, 6, 6))
        const { wrapper, router } = await mountComponent()
        await getNextBtn(wrapper).trigger('click')
        await flushPromises()
        await getPrevBtn(wrapper).trigger('click')
        await flushPromises()
        expect(router.currentRoute.value.query.page).toBeUndefined()
        expect(campaignClient.getCampaigns).toHaveBeenCalledTimes(2)
    })

    it('reads page from URL query param on initial load', async () => {
        campaignClient.getCampaigns
            .mockResolvedValueOnce(makePagedResponse(manyCampaigns(5), true, 5, 6))
            .mockResolvedValueOnce(makePagedResponse([makeCampaign({ id: 6, messageContent: { subject: 'Sixth' } })], false, 6, 6))
        const { wrapper } = await mountComponent({ page: '2' })
        expect(wrapper.text()).toContain('Sixth')
    })

    it('falls back to page 1 for an invalid page query param', async () => {
        const { wrapper } = await mountComponent({ page: 'abc' })
        expect(wrapper.text()).toContain('1')
    })

    it('shows range 0-0 of 0 when no campaigns', async () => {
        campaignClient.getCampaigns.mockResolvedValue(makePagedResponse([]))
        const { wrapper } = await mountComponent()
        expect(wrapper.text()).toContain('0')
    })
})

describe('lists for visible campaigns', () => {
    it('fetches lists for campaigns on the current page', async () => {
        const { } = await mountComponent()
        expect(listMessagesClient.getListsByMessage).toHaveBeenCalledWith(1)
    })

    it('renders list names when lists are loaded', async () => {
        listMessagesClient.getListsByMessage.mockResolvedValue(
            makePagedResponse([{ id: 10, name: 'Subscribers List' }])
        )
        const { wrapper } = await mountComponent()
        expect(wrapper.text()).toContain('Subscribers List')
    })

    it('shows "-" when no lists are associated', async () => {
        const { wrapper } = await mountComponent()
        expect(wrapper.text()).toContain('-')
    })
})

describe('statistics', () => {
    it('fetches campaign statistics on mount', async () => {
        await mountComponent()
        expect(statisticsClient.getCampaignStatistics).toHaveBeenCalled()
        expect(statisticsClient.getStatisticsOfViewOpens).toHaveBeenCalled()
    })

    it('renders bounced count from statistics', async () => {
        const { wrapper } = await mountComponent()
        expect(wrapper.text()).toContain('2') // bounces from defaultStats
    })

    it('paginates through statistics when hasMore is true', async () => {
        statisticsClient.getCampaignStatistics
            .mockResolvedValueOnce(makePagedResponse([{ campaignId: 1, bounces: 1, sent: 50, uniqueViews: 5 }], true, 1))
            .mockResolvedValueOnce(makeStatsResponse([]))
        await mountComponent()
        expect(statisticsClient.getCampaignStatistics).toHaveBeenCalledTimes(2)
    })

    it('stops draining when the server reports hasMore but the cursor never advances', async () => {
        // A server pagination bug (stuck/repeated next_cursor) must not spin the client forever:
        // one call establishes the cursor, a second call sees it hasn't moved and bails out.
        statisticsClient.getStatisticsOfViewOpens.mockResolvedValue(makePagedResponse([], true, 0))
        await mountComponent()
        expect(statisticsClient.getStatisticsOfViewOpens).toHaveBeenCalledTimes(2)
    })
})
