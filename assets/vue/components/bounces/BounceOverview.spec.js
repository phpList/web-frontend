import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import BounceOverview from './BounceOverview.vue'
import { bouncesClient } from '../../api'

vi.mock('../../api', () => ({
    bouncesClient: {
        list: vi.fn(),
    },
}))

const makeBounce = (overrides = {}) => ({
    id: 1,
    date: '2024-03-15T10:30:00Z',
    subscriber_email: 'user@example.com',
    message_subject: 'Test Campaign',
    comment: 'Hard bounce',
    status: 'processed',
    ...overrides,
})

const makeResponse = (items = [], hasMore = false, nextCursor = null) => ({
    items,
    pagination: { hasMore, nextCursor },
})

beforeEach(() => {
    vi.clearAllMocks()
    bouncesClient.list.mockResolvedValue(makeResponse())
})

describe('BounceOverview.vue', () => {

    describe('on mount', () => {
        it('calls bouncesClient.list with cursor=null, pageSize=5, and identified status', async () => {
            const wrapper = mount(BounceOverview)
            await flushPromises()
            expect(bouncesClient.list).toHaveBeenCalledWith(null, 5, 'identified-bounces')
        })

        it('renders bounce rows after a successful load', async () => {
            bouncesClient.list.mockResolvedValue(makeResponse([makeBounce()]))
            const wrapper = mount(BounceOverview)
            await flushPromises()
            expect(wrapper.text()).toContain('user@example.com')
            expect(wrapper.text()).toContain('Test Campaign')
        })

        it('shows empty state when the API returns no items', async () => {
            const wrapper = mount(BounceOverview)
            await flushPromises()
            expect(wrapper.text()).toContain('No bounces found.')
        })

        it('shows an error message when the API rejects', async () => {
            bouncesClient.list.mockRejectedValue(new Error('Network error'))
            const wrapper = mount(BounceOverview)
            await flushPromises()
            expect(wrapper.text()).toContain('Network error')
        })

        it('shows a generic fallback when the error has no message', async () => {
            bouncesClient.list.mockRejectedValue({})
            const wrapper = mount(BounceOverview)
            await flushPromises()
            expect(wrapper.text()).toContain('Failed to load bounces.')
        })
    })

    describe('data normalisation', () => {
        it('falls back to "Unknown email" when subscriber_email is missing', async () => {
            bouncesClient.list.mockResolvedValue(makeResponse([makeBounce({ subscriber_email: null })]))
            const wrapper = mount(BounceOverview)
            await flushPromises()
            expect(wrapper.text()).toContain('Unknown email')
        })

        it('falls back to "No subject" when message_subject is missing', async () => {
            bouncesClient.list.mockResolvedValue(makeResponse([makeBounce({ message_subject: null })]))
            const wrapper = mount(BounceOverview)
            await flushPromises()
            expect(wrapper.text()).toContain('No subject')
        })

        it('falls back to "No comment" when comment is missing', async () => {
            bouncesClient.list.mockResolvedValue(makeResponse([makeBounce({ comment: null })]))
            const wrapper = mount(BounceOverview)
            await flushPromises()
            expect(wrapper.text()).toContain('No comment')
        })

        it('falls back to "unknown" when status is missing', async () => {
            bouncesClient.list.mockResolvedValue(makeResponse([makeBounce({ status: null })]))
            const wrapper = mount(BounceOverview)
            await flushPromises()
            expect(wrapper.text()).toContain('unknown')
        })

        it('shows "No date" for a missing date', async () => {
            bouncesClient.list.mockResolvedValue(makeResponse([makeBounce({ date: null })]))
            const wrapper = mount(BounceOverview)
            await flushPromises()
            expect(wrapper.text()).toContain('No date')
        })

        it('shows "No date" for an invalid date string', async () => {
            bouncesClient.list.mockResolvedValue(makeResponse([makeBounce({ date: 'not-a-date' })]))
            const wrapper = mount(BounceOverview)
            await flushPromises()
            expect(wrapper.text()).toContain('No date')
        })
    })

    describe('getStatusClass', () => {
        const mountWithStatus = async (status) => {
            bouncesClient.list.mockResolvedValue(makeResponse([makeBounce({ status })]))
            const wrapper = mount(BounceOverview)
            await flushPromises()
            return wrapper
        }

        it('applies purple classes for blacklist status', async () => {
            const wrapper = await mountWithStatus('blacklisted')
            expect(wrapper.find('span.bg-purple-100').exists()).toBe(true)
        })

        it('applies amber classes for soft/retry status', async () => {
            const wrapper = await mountWithStatus('soft bounce')
            expect(wrapper.find('span.bg-amber-100').exists()).toBe(true)
        })

        it('applies emerald classes for processed status', async () => {
            const wrapper = await mountWithStatus('processed')
            expect(wrapper.find('span.bg-emerald-100').exists()).toBe(true)
        })

        it('applies slate classes for an unrecognised status', async () => {
            const wrapper = await mountWithStatus('something-else')
            expect(wrapper.find('span.bg-slate-100').exists()).toBe(true)
        })
    })

    describe('status filter', () => {
        it('renders the status select with "identified" as the default', async () => {
            const wrapper = mount(BounceOverview)
            await flushPromises()
            const select = wrapper.find('select#bounce-status-filter')
            expect(select.element.value).toBe('identified')
        })

        it('reloads with unidentified status when filter changes', async () => {
            const wrapper = mount(BounceOverview)
            await flushPromises()
            vi.clearAllMocks()
            bouncesClient.list.mockResolvedValue(makeResponse())

            await wrapper.find('select#bounce-status-filter').setValue('unidentified')
            await flushPromises()

            expect(bouncesClient.list).toHaveBeenCalledWith(null, 5, 'unidentified bounce')
        })

        it('resets to page 1 when the filter changes', async () => {
            bouncesClient.list.mockResolvedValue(makeResponse([makeBounce()], true, 10))
            const wrapper = mount(BounceOverview)
            await flushPromises()

            await wrapper.findAll('button')[1].trigger('click') // next page
            await flushPromises()
            expect(wrapper.text()).toContain('Page 2')

            bouncesClient.list.mockResolvedValue(makeResponse())
            await wrapper.find('select#bounce-status-filter').setValue('unidentified')
            await flushPromises()
            expect(wrapper.text()).toContain('Page 1')
        })
    })

    describe('pagination', () => {
        it('disables Previous on the first page', async () => {
            const wrapper = mount(BounceOverview)
            await flushPromises()
            const [prev] = wrapper.findAll('button')
            expect(prev.attributes('disabled')).toBeDefined()
        })

        it('enables Next when hasMore is true', async () => {
            bouncesClient.list.mockResolvedValue(makeResponse([makeBounce()], true, 10))
            const wrapper = mount(BounceOverview)
            await flushPromises()
            const [, next] = wrapper.findAll('button')
            expect(next.attributes('disabled')).toBeUndefined()
        })

        it('disables Next when hasMore is false', async () => {
            bouncesClient.list.mockResolvedValue(makeResponse([makeBounce()], false))
            const wrapper = mount(BounceOverview)
            await flushPromises()
            const [, next] = wrapper.findAll('button')
            expect(next.attributes('disabled')).toBeDefined()
        })

        it('advances to page 2 and fetches with the next cursor', async () => {
            bouncesClient.list.mockResolvedValue(makeResponse([makeBounce()], true, 42))
            const wrapper = mount(BounceOverview)
            await flushPromises()

            vi.clearAllMocks()
            bouncesClient.list.mockResolvedValue(makeResponse([makeBounce({ id: 2 })], false))
            await wrapper.findAll('button')[1].trigger('click') // Next
            await flushPromises()

            expect(wrapper.text()).toContain('Page 2')
            expect(bouncesClient.list).toHaveBeenCalledWith(42, 5, 'identified-bounces')
        })

        it('goes back to page 1 when Previous is clicked', async () => {
            bouncesClient.list.mockResolvedValue(makeResponse([makeBounce()], true, 42))
            const wrapper = mount(BounceOverview)
            await flushPromises()

            await wrapper.findAll('button')[1].trigger('click') // Next
            await flushPromises()

            vi.clearAllMocks()
            bouncesClient.list.mockResolvedValue(makeResponse([makeBounce()]))
            await wrapper.findAll('button')[0].trigger('click') // Previous
            await flushPromises()

            expect(wrapper.text()).toContain('Page 1')
            expect(bouncesClient.list).toHaveBeenCalledWith(null, 5, 'identified-bounces')
        })
    })

    describe('stale request cancellation', () => {
        it('ignores a slow response that arrives after a newer request', async () => {
            let resolveFirst
            const slowRequest = new Promise((res) => { resolveFirst = res })
            bouncesClient.list
                .mockReturnValueOnce(slowRequest)
                .mockResolvedValueOnce(makeResponse([makeBounce({ subscriber_email: 'new@example.com' })]))

            const wrapper = mount(BounceOverview)

            await wrapper.find('select#bounce-status-filter').setValue('unidentified')
            await flushPromises()

            resolveFirst(makeResponse([makeBounce({ subscriber_email: 'stale@example.com' })]))
            await flushPromises()

            expect(wrapper.text()).not.toContain('stale@example.com')
            expect(wrapper.text()).toContain('new@example.com')
        })
    })
})
