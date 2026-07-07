// SubscriberModal.spec.js

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SubscriberModal from '../../../../../../assets/vue/components/subscribers/SubscriberModal.vue'
import { subscribersClient } from '../../../../../../assets/vue/api'

vi.mock('../../../../../../assets/vue/api', () => ({
    subscribersClient: {
        getSubscriber: vi.fn(),
        updateSubscriber: vi.fn(),
    },
}))

const BaseIconStub = {
    name: 'BaseIcon',
    template: '<span />',
}

describe('SubscriberModal', () => {
    const subscriber = {
        id: 123,
        email: 'john@example.com',
        confirmed: true,
        blacklisted: false,
        htmlEmail: true,
        disabled: false,
        bounceCount: 2,
        uniqueId: 'ABC123',
        uuid: 'uuid-123',
        createdAt: '2025-01-01',
        updatedAt: '2025-01-02',
        subscribedLists: [
            { id: 1, name: 'Newsletter' },
            { id: 2, name: 'Customers' },
        ],
    }

    const createWrapper = (props = {}) =>
        mount(SubscriberModal, {
            props: {
                isOpen: true,
                subscriberId: 123,
                ...props,
            },
            global: {
                stubs: {
                    BaseIcon: BaseIconStub,
                },
            },
        })

    beforeEach(() => {
        vi.clearAllMocks()

        subscribersClient.getSubscriber.mockResolvedValue(
            subscriber
        )
    })

    it('does not render when closed', () => {
        const wrapper = createWrapper({
            isOpen: false,
        })

        expect(wrapper.find('[role="dialog"]').exists())
            .toBe(false)
    })

    it('loads subscriber details when opened', async () => {
        createWrapper()

        await flushPromises()

        expect(
            subscribersClient.getSubscriber
        ).toHaveBeenCalledWith(123)
    })

    it('renders subscriber details', async () => {
        const wrapper = createWrapper()

        await flushPromises()

        expect(
            wrapper.find('input[type="email"]').element.value
        ).toBe('john@example.com')

        expect(wrapper.text())
            .toContain('Subscriber Details ID: 123')
    })

    it('populates form fields', async () => {
        const wrapper = createWrapper()

        await flushPromises()

        expect(
            wrapper.find('input[type="email"]')
                .element.value
        ).toBe('john@example.com')

        expect(
            wrapper.find('#confirmed').element.checked
        ).toBe(true)

        expect(
            wrapper.find('#htmlEmail').element.checked
        ).toBe(true)
    })

    it('renders subscribed lists', async () => {
        const wrapper = createWrapper()

        await flushPromises()

        expect(wrapper.text())
            .toContain('Newsletter')

        expect(wrapper.text())
            .toContain('Customers')
    })

    it('shows "No lists" when subscriber has no subscriptions', async () => {
        subscribersClient.getSubscriber.mockResolvedValue({
            ...subscriber,
            subscribedLists: [],
        })

        const wrapper = createWrapper()

        await flushPromises()

        expect(wrapper.text())
            .toContain('No lists')
    })

    it('renders subscriber metadata', async () => {
        const wrapper = createWrapper()

        await flushPromises()

        expect(wrapper.text())
            .toContain('Bounce Count: 2')

        expect(wrapper.text())
            .toContain('Unique ID: ABC123')

        expect(wrapper.text())
            .toContain('UUID: uuid-123')
    })

    it('shows fetch errors', async () => {
        subscribersClient.getSubscriber
            .mockRejectedValue(
                new Error('Failed to load')
            )

        const wrapper = createWrapper()

        await flushPromises()

        expect(wrapper.text())
            .toContain('Failed to load')
    })

    it('saves subscriber changes', async () => {
        subscribersClient.updateSubscriber
            .mockResolvedValue({
                ...subscriber,
                email: 'updated@example.com',
            })

        const wrapper = createWrapper()

        await flushPromises()

        await wrapper
            .find('input[type="email"]')
            .setValue('updated@example.com')

        const saveButton = wrapper
            .findAll('button')
            .find(btn => btn.text().includes('Save'))

        await saveButton.trigger('click')

        await flushPromises()

        expect(
            subscribersClient.updateSubscriber
        ).toHaveBeenCalledWith(
            123,
            expect.objectContaining({
                email: 'updated@example.com',
            })
        )
    })

    it('emits updated after successful save', async () => {
        const updatedSubscriber = {
            ...subscriber,
            email: 'updated@example.com',
        }

        subscribersClient.updateSubscriber
            .mockResolvedValue(updatedSubscriber)

        const wrapper = createWrapper()

        await flushPromises()

        const saveButton = wrapper
            .findAll('button')
            .find(btn => btn.text().includes('Save'))

        await saveButton.trigger('click')

        await flushPromises()

        expect(wrapper.emitted('updated'))
            .toEqual([[updatedSubscriber]])
    })

    it('emits close after successful save', async () => {
        subscribersClient.updateSubscriber
            .mockResolvedValue(subscriber)

        const wrapper = createWrapper()

        await flushPromises()

        const saveButton = wrapper
            .findAll('button')
            .find(btn => btn.text().includes('Save'))

        await saveButton.trigger('click')

        await flushPromises()

        expect(wrapper.emitted('close'))
            .toHaveLength(1)
    })

    it('shows save errors', async () => {
        subscribersClient.updateSubscriber
            .mockRejectedValue(
                new Error('Save failed')
            )

        const wrapper = createWrapper()

        await flushPromises()

        const saveButton = wrapper
            .findAll('button')
            .find(btn => btn.text().includes('Save'))

        await saveButton.trigger('click')

        await flushPromises()

        expect(wrapper.text())
            .toContain('Save failed')
    })

    it('emits close when cancel is clicked', async () => {
        const wrapper = createWrapper()

        await flushPromises()

        const cancelButton = wrapper
            .findAll('button')
            .find(btn => btn.text() === 'Cancel')

        await cancelButton.trigger('click')

        expect(wrapper.emitted('close'))
            .toHaveLength(1)
    })

    it('emits close when backdrop is clicked', async () => {
        const wrapper = createWrapper()

        await flushPromises()

        const backdrop = wrapper.find(
            '.bg-slate-900\\/50'
        )

        await backdrop.trigger('click')

        expect(wrapper.emitted('close'))
            .toHaveLength(1)
    })

    it('reloads when subscriberId changes', async () => {
        const wrapper = createWrapper()

        await flushPromises()

        await wrapper.setProps({
            subscriberId: 456,
        })

        await flushPromises()

        expect(
            subscribersClient.getSubscriber
        ).toHaveBeenCalledWith(456)
    })
})
