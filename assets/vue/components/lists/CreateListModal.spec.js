// CreateListModal.spec.js

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import CreateListModal from './CreateListModal.vue'
import { listClient } from '../../api'
import { Requests } from '@tatevikgr/rest-api-client'

vi.mock('../../api', () => ({
    listClient: {
        createList: vi.fn(),
    },
}))

vi.mock('@tatevikgr/rest-api-client', () => ({
    Requests: {
        CreateSubscriberListRequest: vi.fn(function (
            name,
            isPublic,
            listPosition,
            description
        ) {
            this.name = name
            this.public = isPublic
            this.listPosition = listPosition
            this.description = description
        }),
    },
}))

const BaseIconStub = {
    name: 'BaseIcon',
    props: ['name'],
    template: '<span />',
}

describe('CreateListModal', () => {
    const createWrapper = (props = {}) =>
        mount(CreateListModal, {
            props: {
                isOpen: true,
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

        expect(wrapper.text()).toContain('Create New List')
        expect(wrapper.find('#list-name').exists()).toBe(true)
    })

    it('does not render when closed', () => {
        const wrapper = createWrapper({
            isOpen: false,
        })

        expect(wrapper.find('form').exists()).toBe(false)
    })

    it('emits close when cancel is clicked', async () => {
        const wrapper = createWrapper()

        const cancelButton = wrapper
            .findAll('button')
            .find(button => button.text() === 'Cancel')

        await cancelButton.trigger('click')

        expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('emits close when overlay is clicked', async () => {
        const wrapper = createWrapper()

        const overlay = wrapper.find('.bg-slate-900\\/50')

        await overlay.trigger('click')

        expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('shows validation error when name is empty', async () => {
        const wrapper = createWrapper()

        await wrapper.find('form').trigger('submit')

        expect(wrapper.text()).toContain('Name is required.')

        expect(listClient.createList).not.toHaveBeenCalled()
    })

    it('validates negative list positions', async () => {
        const wrapper = createWrapper()

        await wrapper.find('#list-name').setValue('Newsletter')
        await wrapper.find('#list-position').setValue('-1')

        await wrapper.find('form').trigger('submit')

        expect(wrapper.text()).toContain(
            'List Position must be a whole number greater than or equal to 0.'
        )

        expect(listClient.createList).not.toHaveBeenCalled()
    })

    it('validates non-integer list positions', async () => {
        const wrapper = createWrapper()

        await wrapper.find('#list-name').setValue('Newsletter')
        await wrapper.find('#list-position').setValue('1.5')

        await wrapper.find('form').trigger('submit')

        expect(wrapper.text()).toContain(
            'List Position must be a whole number greater than or equal to 0.'
        )
    })

    it('creates a list successfully', async () => {
        const createdList = {
            id: 1,
            name: 'Newsletter',
        }

        listClient.createList.mockResolvedValue(createdList)

        const wrapper = createWrapper()

        await wrapper.find('#list-name').setValue('Newsletter')
        await wrapper.find('#list-public').setValue(true)
        await wrapper.find('#list-position').setValue('3')
        await wrapper.find('#list-description').setValue(
            'Weekly newsletter'
        )

        await wrapper.find('form').trigger('submit')

        expect(Requests.CreateSubscriberListRequest)
            .toHaveBeenCalledWith(
                'Newsletter',
                true,
                3,
                'Weekly newsletter'
            )

        expect(listClient.createList).toHaveBeenCalledTimes(1)

        expect(wrapper.emitted('created')).toEqual([
            [createdList],
        ])

        expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('passes null for empty optional fields', async () => {
        listClient.createList.mockResolvedValue({
            id: 1,
        })

        const wrapper = createWrapper()

        await wrapper.find('#list-name').setValue('Newsletter')

        await wrapper.find('form').trigger('submit')

        expect(Requests.CreateSubscriberListRequest)
            .toHaveBeenCalledWith(
                'Newsletter',
                false,
                null,
                null
            )
    })

    it('trims name and description', async () => {
        listClient.createList.mockResolvedValue({
            id: 1,
        })

        const wrapper = createWrapper()

        await wrapper.find('#list-name').setValue(
            '  Newsletter  '
        )

        await wrapper.find('#list-description').setValue(
            '  Description  '
        )

        await wrapper.find('form').trigger('submit')

        expect(Requests.CreateSubscriberListRequest)
            .toHaveBeenCalledWith(
                'Newsletter',
                false,
                null,
                'Description'
            )
    })

    it('shows api errors', async () => {
        listClient.createList.mockRejectedValue(
            new Error('API failed')
        )

        const wrapper = createWrapper()

        await wrapper.find('#list-name').setValue('Newsletter')

        await wrapper.find('form').trigger('submit')
        await nextTick()

        expect(wrapper.text()).toContain('API failed')
    })

    it('disables submit button when name is empty', () => {
        const wrapper = createWrapper()

        const submitButton = wrapper
            .findAll('button')
            .find(button => button.text().includes('Create'))

        expect(submitButton.attributes('disabled'))
            .toBeDefined()
    })

    it('resets form when reopened', async () => {
        const wrapper = createWrapper()

        await wrapper.find('#list-name').setValue('Newsletter')
        await wrapper.find('#list-description').setValue('Test')

        await wrapper.setProps({
            isOpen: false,
        })

        await wrapper.setProps({
            isOpen: true,
        })

        expect(
            wrapper.find('#list-name').element.value
        ).toBe('')

        expect(
            wrapper.find('#list-description').element.value
        ).toBe('')
    })
})
