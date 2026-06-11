// AdminLayout.spec.js

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import AdminLayout from './AdminLayout.vue'
import { backendFetch, subscribersClient, campaignClient } from '../api'

const openSidebar = vi.fn()

vi.mock('../composables/useSidebar', () => ({
    useSidebar: () => ({
        openSidebar,
    }),
}))

vi.mock('../api', () => ({
    backendFetch: vi.fn(),
    subscribersClient: {
        getSubscribers: vi.fn(),
    },
    campaignClient: {
        getCampaigns: vi.fn(),
    },
}))

vi.mock('@tatevikgr/rest-api-client', () => ({
    Requests: {
        SubscribersFilterRequest: vi.fn().mockImplementation(
            (...args) => ({ args })
        ),
    },
}))

const BaseIconStub = {
    name: 'BaseIcon',
    props: ['name'],
    template: '<span class="icon">{{ name }}</span>',
}

describe('AdminLayout', () => {
    const mountedWrappers = []

    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()

        backendFetch.mockResolvedValue({
            ok: true,
            json: () =>
                Promise.resolve({
                    login_name: 'admin',
                    super_user: true,
                }),
        })
    })

    afterEach(() => {
        mountedWrappers.forEach((wrapper) => wrapper.unmount())
        mountedWrappers.length = 0
        vi.useRealTimers()
    })

    const createWrapper = () => {
        const wrapper = mount(AdminLayout, {
            global: {
                stubs: {
                    BaseIcon: BaseIconStub,
                    RouterLink: {
                        props: ['to'],
                        template: '<a :href="to"><slot /></a>',
                    },
                },
            },
            slots: {
                default: '<div>Page Content</div>',
            },
        })
        mountedWrappers.push(wrapper)
        return wrapper
    }

    it('renders slot content', () => {
        const wrapper = createWrapper()

        expect(wrapper.text()).toContain('Page Content')
    })

    it('loads admin data on mount', async () => {
        const wrapper = createWrapper()

        await flushPromises()

        expect(backendFetch).toHaveBeenCalledWith(
            '/admin-about',
            expect.any(Object)
        )

        expect(wrapper.text()).toContain('admin')
        expect(wrapper.text()).toContain('Super Admin')
    })

    it('shows fallback admin name', () => {
        const wrapper = createWrapper()

        expect(wrapper.text()).toContain('Admin User')
    })

    it('opens sidebar', async () => {
        const wrapper = createWrapper()

        const menuButton = wrapper.find('button')

        await menuButton.trigger('click')

        expect(openSidebar).toHaveBeenCalled()
    })

    it('toggles dropdown', async () => {
        const wrapper = createWrapper()

        await flushPromises()

        expect(wrapper.text()).not.toContain('Logout')

        const dropdownTrigger = wrapper.find('div.cursor-pointer')

        await dropdownTrigger.trigger('click')

        expect(wrapper.text()).toContain('Logout')
    })

    it('searches subscribers and campaigns', async () => {
        subscribersClient.getSubscribers.mockResolvedValue({
            items: [
                {
                    id: 1,
                    email: 'john@example.com',
                },
            ],
        })

        campaignClient.getCampaigns.mockResolvedValue({
            items: [
                {
                    id: 5,
                    messageContent: {
                        subject: 'Newsletter',
                    },
                },
            ],
        })

        const wrapper = createWrapper()

        const input = wrapper.find('input')

        await input.setValue('john')

        vi.advanceTimersByTime(300)

        await flushPromises()

        expect(subscribersClient.getSubscribers)
            .toHaveBeenCalled()

        expect(campaignClient.getCampaigns)
            .toHaveBeenCalled()

        expect(wrapper.text())
            .toContain('john@example.com')

        expect(wrapper.text())
            .toContain('Newsletter')
    })

    it('shows no results message', async () => {
        subscribersClient.getSubscribers.mockResolvedValue({
            items: [],
        })

        campaignClient.getCampaigns.mockResolvedValue({
            items: [],
        })

        const wrapper = createWrapper()

        await wrapper.find('input').setValue('test')

        vi.advanceTimersByTime(300)

        await flushPromises()

        expect(wrapper.text())
            .toContain('No results found')
    })

    it('clears results when query is empty', async () => {
        const wrapper = createWrapper()

        const input = wrapper.find('input')

        await input.setValue('abc')
        await input.setValue('')

        vi.advanceTimersByTime(300)

        await flushPromises()

        expect(
            subscribersClient.getSubscribers
        ).not.toHaveBeenCalled()
    })

    it('shows searching state', async () => {
        subscribersClient.getSubscribers.mockImplementation(
            () => new Promise(() => {})
        )

        campaignClient.getCampaigns.mockImplementation(
            () => new Promise(() => {})
        )

        const wrapper = createWrapper()

        await wrapper.find('input').setValue('abc')

        vi.advanceTimersByTime(300)

        await wrapper.vm.$nextTick()

        expect(wrapper.text())
            .toContain('Searching...')
    })

    it('handles search errors', async () => {
        const errorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {})

        subscribersClient.getSubscribers
            .mockRejectedValue(new Error('boom'))

        campaignClient.getCampaigns
            .mockRejectedValue(new Error('boom'))

        const wrapper = createWrapper()

        await wrapper.find('input').setValue('abc')

        vi.advanceTimersByTime(300)

        await flushPromises()

        expect(errorSpy).toHaveBeenCalled()

        errorSpy.mockRestore()
    })

    it('closes search results on outside click', async () => {
        const wrapper = createWrapper()

        await wrapper.find('input').trigger('focus')

        document.body.dispatchEvent(
            new MouseEvent('click', {
                bubbles: true,
            })
        )

        await wrapper.vm.$nextTick()

        expect(wrapper.text())
            .not.toContain('No results found')
    })

    it('renders subscriber search link', async () => {
        subscribersClient.getSubscribers.mockResolvedValue({
            items: [
                {
                    id: 1,
                    email: 'john@example.com',
                },
            ],
        })

        campaignClient.getCampaigns.mockResolvedValue({
            items: [],
        })

        const wrapper = createWrapper()

        await wrapper.find('input').setValue('john')

        vi.advanceTimersByTime(300)

        await flushPromises()

        const link = wrapper
            .findAll('a')
            .find(a =>
                a.attributes('href')?.includes(
                    '/subscribers'
                )
            )

        expect(link.attributes('href'))
            .toContain('findValue=john%40example.com')
    })

    it('renders campaign search link', async () => {
        subscribersClient.getSubscribers.mockResolvedValue({
            items: [],
        })

        campaignClient.getCampaigns.mockResolvedValue({
            items: [
                {
                    id: 7,
                    messageContent: {
                        subject: 'Campaign',
                    },
                },
            ],
        })

        const wrapper = createWrapper()

        await wrapper.find('input').setValue('camp')

        vi.advanceTimersByTime(300)

        await flushPromises()

        expect(wrapper.html())
            .toContain('/campaigns/7/edit')
    })
})
