// AddSubscribersModal.spec.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import AddSubscribersModal from '../../../../../../assets/vue/components/lists/AddSubscribersModal.vue'
import { subscriptionClient } from '../../../../../../assets/vue/api'

vi.mock('../../../../../../assets/vue/api', () => ({
    subscriptionClient: {
        createSubscriptions: vi.fn(),
    },
}))

const BaseIconStub = {
    name: 'BaseIcon',
    props: ['name'],
    template: '<span class="base-icon" />',
}

describe('AddSubscribersModal', () => {
    const createWrapper = (props = {}) =>
        mount(AddSubscribersModal, {
            props: {
                isOpen: true,
                list: {
                    id: 123,
                    name: 'Newsletter',
                },
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
    })

    it('renders when open', () => {
        const wrapper = createWrapper()

        expect(wrapper.text()).toContain('Add subscribers')
        expect(wrapper.find('#subscriber-emails').exists()).toBe(true)
    })

    it('does not render when closed', () => {
        const wrapper = createWrapper({
            isOpen: false,
        })

        expect(wrapper.find('form').exists()).toBe(false)
    })

    it('emits close when cancel is clicked', async () => {
        const wrapper = createWrapper()

        const buttons = wrapper.findAll('button')
        const cancelButton = buttons.find(
            button => button.text() === 'Cancel'
        )

        await cancelButton.trigger('click')

        expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('emits close when overlay is clicked', async () => {
        const wrapper = createWrapper()

        const overlay = wrapper.find('.bg-slate-900\\/50')

        await overlay.trigger('click')

        expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('shows error when no list is selected', async () => {
        const wrapper = createWrapper({
            list: null,
        })

        await wrapper.find('textarea').setValue('john@example.com')
        await wrapper.find('form').trigger('submit')

        expect(wrapper.text()).toContain(
            'No mailing list selected.'
        )

        expect(subscriptionClient.createSubscriptions)
            .not.toHaveBeenCalled()
    })

    it('shows error for invalid emails', async () => {
        const wrapper = createWrapper()

        await wrapper.find('textarea').setValue(`
      john@example.com
      invalid-email
    `)

        await wrapper.find('form').trigger('submit')

        expect(wrapper.text()).toContain(
            'Invalid email(s): invalid-email'
        )

        expect(subscriptionClient.createSubscriptions)
            .not.toHaveBeenCalled()
    })

    it('submits valid emails', async () => {
        subscriptionClient.createSubscriptions.mockResolvedValue()

        const wrapper = createWrapper()

        await wrapper.find('textarea').setValue(`
      john@example.com
      jane@example.com
    `)

        await wrapper.find('form').trigger('submit')

        expect(subscriptionClient.createSubscriptions)
            .toHaveBeenCalledWith(
                ['john@example.com', 'jane@example.com'],
                123,
                false
            )

        expect(wrapper.emitted('added')).toHaveLength(1)
        expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('supports comma separated emails', async () => {
        subscriptionClient.createSubscriptions.mockResolvedValue()

        const wrapper = createWrapper()

        await wrapper.find('textarea').setValue(
            'john@example.com,jane@example.com'
        )

        await wrapper.find('form').trigger('submit')

        expect(subscriptionClient.createSubscriptions)
            .toHaveBeenCalledWith(
                ['john@example.com', 'jane@example.com'],
                123,
                false
            )
    })

    it('passes autoConfirm value', async () => {
        subscriptionClient.createSubscriptions.mockResolvedValue()

        const wrapper = createWrapper()

        await wrapper.find('textarea').setValue(
            'john@example.com'
        )

        await wrapper.find('input[type="checkbox"]')
            .setValue(true)

        await wrapper.find('form').trigger('submit')

        expect(subscriptionClient.createSubscriptions)
            .toHaveBeenCalledWith(
                ['john@example.com'],
                123,
                true
            )
    })

    it('shows api errors', async () => {
        subscriptionClient.createSubscriptions.mockRejectedValue(
            new Error('API failed')
        )

        const wrapper = createWrapper()

        await wrapper.find('textarea').setValue(
            'john@example.com'
        )

        await wrapper.find('form').trigger('submit')

        await nextTick()

        expect(wrapper.text()).toContain('API failed')
    })

    it('disables submit button when email field is empty', () => {
        const wrapper = createWrapper()

        const submitButton = wrapper
            .findAll('button')
            .find(button =>
                button.text().includes('Add subscribers')
            )

        expect(submitButton.attributes('disabled'))
            .toBeDefined()
    })

    it('resets form when modal is reopened', async () => {
        const wrapper = createWrapper()

        await wrapper.find('textarea')
            .setValue('john@example.com')

        await wrapper.setProps({
            isOpen: false,
        })

        await wrapper.setProps({
            isOpen: true,
        })

        expect(
            wrapper.find('textarea').element.value
        ).toBe('')
    })
})
