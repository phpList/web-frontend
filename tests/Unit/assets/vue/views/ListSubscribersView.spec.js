import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ListSubscribersView from '../../../../../assets/vue/views/ListSubscribersView.vue'
import * as api from '../../../../../assets/vue/api'

vi.mock('vue-router', () => ({
    useRoute: () => ({
        params: {
            listId: '1',
        },
        query: {
            listName: 'Newsletter',
        },
    }),
}))

describe('ListSubscribersView', () => {
    beforeEach(() => {
        vi.restoreAllMocks()

        vi.spyOn(api.subscriptionClient, 'getSubscriberList').mockResolvedValue({
            id: 1,
            name: 'Newsletter',
        })

        vi.spyOn(api.subscriptionClient, 'getSubscriberLists').mockResolvedValue({
            items: [],
            pagination: {
                hasMore: false,
                nextCursor: null,
            },
        })

        vi.spyOn(api.subscriptionClient, 'getSubscribersOfList').mockResolvedValue({
            items: [
                {
                    id: 1,
                    email: 'john@example.com',
                    confirmed: true,
                    createdAt: '2024-01-01T00:00:00Z',
                },
            ],
            pagination: {
                total: 1,
                nextCursor: null,
            },
        })
    })

    const mountComponent = async () => {
        const wrapper = mount(ListSubscribersView, {
            global: {
                stubs: {
                    AdminLayout: {
                        template: '<div><slot /></div>',
                    },
                    RouterLink: true,
                    BaseIcon: true,
                    ListSubscribersExportPanel: true,
                },
            },
        })

        await flushPromises()

        return wrapper
    }

    it('renders subscriber list', async () => {
        const wrapper = await mountComponent()

        expect(api.subscriptionClient.getSubscribersOfList).toHaveBeenCalled()
        expect(api.subscriptionClient.getSubscriberList).toHaveBeenCalled()
        expect(api.subscriptionClient.getSubscriberLists).toHaveBeenCalled()

        expect(wrapper.text()).toContain('Newsletter')
        expect(wrapper.text()).toContain('john@example.com')
        expect(wrapper.text()).toContain('Confirmed')
    })

    it('shows an error when loading subscribers fails', async () => {
        api.subscriptionClient.getSubscribersOfList.mockRejectedValueOnce(
            new Error('API error')
        )

        const wrapper = await mountComponent()

        expect(wrapper.text()).toContain(
            'Failed to load subscribers for this list.'
        )
    })

    it('shows empty state when there are no subscribers', async () => {
        api.subscriptionClient.getSubscribersOfList.mockResolvedValueOnce({
            items: [],
            pagination: {
                total: 0,
                nextCursor: null,
            },
        })

        const wrapper = await mountComponent()

        expect(wrapper.text()).toContain('No subscribers for this filter.')
    })
})
