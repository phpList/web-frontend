import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import AdminNotifications from '../../../../../../assets/vue/components/notifications/AdminNotifications.vue'
import { backendFetch } from '../../../../../../assets/vue/api'
import { __resetCurrentAdminForTests } from '../../../../../../assets/vue/composables/useCurrentAdmin'
import { __resetAdminNotificationsForTests } from '../../../../../../assets/vue/composables/useAdminNotifications'

vi.mock('../../../../../../assets/vue/api', () => ({ backendFetch: vi.fn() }))

const ok = (body) => ({ ok: true, json: async () => body })

describe('AdminNotifications', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
        __resetCurrentAdminForTests()
        __resetAdminNotificationsForTests()
    })

    const withItems = (items) =>
        backendFetch.mockImplementation(async (url) =>
            ok(url === '/admin-notifications' ? { items } : {}))

    it('shows the bell without an unread dot or dropdown when empty', async () => {
        withItems([])
        const wrapper = mount(AdminNotifications)
        await flushPromises()

        expect(wrapper.find('[data-testid="notifications-bell"]').exists()).toBe(true)
        expect(wrapper.find('[data-testid="notifications-unread"]').exists()).toBe(false)
        expect(wrapper.find('[data-testid="notifications-dropdown"]').exists()).toBe(false)
    })

    it('shows an unread dot, lists notifications in the dropdown and clears the dot on open', async () => {
        withItems([
            { code: 'a', level: 'info', message: 'Queue has 2', context: {} },
            { code: 'b', level: 'warning', message: 'Not writable', context: {} },
        ])
        const wrapper = mount(AdminNotifications)
        await flushPromises()

        expect(wrapper.find('[data-testid="notifications-unread"]').exists()).toBe(true)
        expect(wrapper.text()).not.toContain('Queue has 2')

        await wrapper.find('[data-testid="notifications-bell"]').trigger('click')

        expect(wrapper.text()).toContain('Queue has 2')
        expect(wrapper.text()).toContain('Not writable')
        expect(wrapper.find('[data-testid="notifications-unread"]').exists()).toBe(false)
    })

    it('lets the user dismiss a notification', async () => {
        withItems([
            { code: 'a', level: 'info', message: 'Queue has 2', context: {} },
            { code: 'b', level: 'warning', message: 'Not writable', context: {} },
        ])
        const wrapper = mount(AdminNotifications)
        await flushPromises()
        await wrapper.find('[data-testid="notifications-bell"]').trigger('click')
        await wrapper.find('[aria-label="Dismiss notification"]').trigger('click')

        expect(wrapper.text()).not.toContain('Queue has 2')
        expect(wrapper.text()).toContain('Not writable')
    })

    it('stays quiet when the request fails', async () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
        backendFetch.mockImplementation(async (url) =>
            url === '/admin-notifications' ? { ok: false, status: 502 } : ok({}))

        const wrapper = mount(AdminNotifications)
        await flushPromises()

        expect(wrapper.find('[data-testid="notifications-unread"]').exists()).toBe(false)
        spy.mockRestore()
    })

    describe('seen state per administrator', () => {
        const items = [{ code: 'a', level: 'info', message: 'Queue has 2', context: {} }]

        const mountAs = async (admin) => {
            backendFetch.mockImplementation(async (url) =>
                ok(url === '/admin-notifications' ? { items } : admin))
            const wrapper = mount(AdminNotifications)
            await flushPromises()
            return wrapper
        }

        const switchAdmin = () => {
            // Simulates a fresh page load; localStorage is kept.
            __resetCurrentAdminForTests()
            __resetAdminNotificationsForTests()
        }

        it('stores seen codes under an administrator-specific key', async () => {
            const wrapper = await mountAs({ id: 7, login_name: 'alice' })
            await wrapper.find('[data-testid="notifications-bell"]').trigger('click')

            expect(JSON.parse(localStorage.getItem('phplist.seenNotifications.7'))).toEqual(['a'])
            expect(localStorage.getItem('phplist.seenNotifications')).toBeNull()
        })

        it('does not share seen codes between administrators', async () => {
            const first = await mountAs({ id: 1, login_name: 'alice' })
            await first.find('[data-testid="notifications-bell"]').trigger('click')
            expect(first.find('[data-testid="notifications-unread"]').exists()).toBe(false)
            first.unmount()

            switchAdmin()
            const second = await mountAs({ id: 2, login_name: 'bob' })
            expect(second.find('[data-testid="notifications-unread"]').exists()).toBe(true)
            second.unmount()

            switchAdmin()
            const again = await mountAs({ id: 1, login_name: 'alice' })
            expect(again.find('[data-testid="notifications-unread"]').exists()).toBe(false)
        })

        it('does not persist when the administrator cannot be identified', async () => {
            const wrapper = await mountAs({})
            await wrapper.find('[data-testid="notifications-bell"]').trigger('click')

            expect(wrapper.find('[data-testid="notifications-unread"]').exists()).toBe(false)
            expect(localStorage.length).toBe(0)
        })
    })
})
