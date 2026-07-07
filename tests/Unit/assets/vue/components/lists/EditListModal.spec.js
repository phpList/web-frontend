// EditListModal.spec.js

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import EditListModal from '../../../../../../assets/vue/components/lists/EditListModal.vue'
import { listClient } from '../../../../../../assets/vue/api'
import { Requests } from '@tatevikgr/rest-api-client'

vi.mock('../../../../../../assets/vue/api', () => ({
    listClient: {
        updateList: vi.fn(),
    },
}))

vi.mock('@tatevikgr/rest-api-client', () => ({
    Requests: {
        CreateSubscriberListRequest: vi.fn(function (...args) {
            this.args = args
        }),
    },
}))

const BaseIconStub = {
    name: 'BaseIcon',
    template: '<span />',
}

describe('EditListModal', () => {
    const list = {
        id: 123,
        name: 'Newsletter',
        public: true,
        listPosition: 5,
        description: 'Weekly updates',
        category: 'News',
        rss_feed: 'https://example.com/rss',
        subject_prefix: '[News]',
    }

    const createWrapper = (props = {}) =>
        mount(EditListModal, {
            props: {
                isOpen: true,
                list,
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

        expect(wrapper.text()).toContain('Edit List')
    })

    it('does not render when closed', () => {
        const wrapper = createWrapper({
            isOpen: false,
        })

        expect(wrapper.find('form').exists()).toBe(false)
    })

    it('pre-populates form from list', () => {
        const wrapper = createWrapper()

        expect(wrapper.find('#list-name').element.value)
            .toBe('Newsletter')

        expect(wrapper.find('#list-public').element.checked)
            .toBe(true)

        expect(wrapper.find('#list-position').element.value)
            .toBe('5')

        expect(wrapper.find('#list-description').element.value)
            .toBe('Weekly updates')

        expect(wrapper.find('#list-category').element.value)
            .toBe('News')

        expect(wrapper.find('#list-rss').element.value)
            .toBe('https://example.com/rss')

        expect(wrapper.find('#list-prefix').element.value)
            .toBe('[News]')
    })

    it('supports snake_case list_position', () => {
        const wrapper = createWrapper({
            list: {
                ...list,
                listPosition: undefined,
                list_position: 10,
            },
        })

        expect(
            wrapper.find('#list-position').element.value
        ).toBe('10')
    })

    it('emits close when cancel is clicked', async () => {
        const wrapper = createWrapper()

        const cancelButton = wrapper
            .findAll('button')
            .find(button => button.text() === 'Cancel')

        await cancelButton.trigger('click')

        expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('shows validation error when name is empty', async () => {
        const wrapper = createWrapper()

        await wrapper.find('#list-name').setValue('')

        await wrapper.find('form').trigger('submit')

        expect(wrapper.text()).toContain(
            'Name is required.'
        )

        expect(listClient.updateList)
            .not.toHaveBeenCalled()
    })

    it('validates negative positions', async () => {
        const wrapper = createWrapper()

        await wrapper.find('#list-position')
            .setValue('-1')

        await wrapper.find('form').trigger('submit')

        expect(wrapper.text()).toContain(
            'List Position must be a whole number greater than or equal to 0.'
        )
    })

    it('validates decimal positions', async () => {
        const wrapper = createWrapper()

        await wrapper.find('#list-position')
            .setValue('2.5')

        await wrapper.find('form').trigger('submit')

        expect(wrapper.text()).toContain(
            'List Position must be a whole number greater than or equal to 0.'
        )
    })

    it('updates a list successfully', async () => {
        const updatedList = {
            id: 123,
            name: 'Updated',
        }

        listClient.updateList.mockResolvedValue(updatedList)

        const wrapper = createWrapper()

        await wrapper.find('#list-name')
            .setValue('Updated')

        await wrapper.find('#list-public')
            .setValue(false)

        await wrapper.find('#list-position')
            .setValue('7')

        await wrapper.find('#list-description')
            .setValue('Updated description')

        await wrapper.find('#list-category')
            .setValue('Marketing')

        await wrapper.find('#list-rss')
            .setValue('https://example.com/new-rss')

        await wrapper.find('#list-prefix')
            .setValue('[Marketing]')

        await wrapper.find('form').trigger('submit')

        expect(Requests.CreateSubscriberListRequest)
            .toHaveBeenCalledWith(
                'Updated',
                false,
                7,
                'Updated description',
                '[Marketing]',
                'https://example.com/new-rss',
                'Marketing'
            )

        expect(listClient.updateList)
            .toHaveBeenCalledWith(
                123,
                expect.any(Object)
            )

        expect(wrapper.emitted('updated'))
            .toEqual([[updatedList]])

        expect(wrapper.emitted('close'))
            .toHaveLength(1)
    })

    it('passes null for empty optional fields', async () => {
        listClient.updateList.mockResolvedValue({
            id: 123,
        })

        const wrapper = createWrapper()

        await wrapper.find('#list-description')
            .setValue('')

        await wrapper.find('#list-category')
            .setValue('')

        await wrapper.find('#list-rss')
            .setValue('')

        await wrapper.find('#list-prefix')
            .setValue('')

        await wrapper.find('#list-position')
            .setValue('')

        await wrapper.find('form').trigger('submit')

        expect(Requests.CreateSubscriberListRequest)
            .toHaveBeenCalledWith(
                'Newsletter',
                true,
                null,
                null,
                null,
                null,
                null
            )
    })

    it('shows api errors', async () => {
        listClient.updateList.mockRejectedValue(
            new Error('Update failed')
        )

        const wrapper = createWrapper()

        await wrapper.find('form').trigger('submit')

        await nextTick()

        expect(wrapper.text())
            .toContain('Update failed')
    })

    it('does nothing when list id is missing', async () => {
        const wrapper = createWrapper({
            list: {
                name: 'No Id',
            },
        })

        await wrapper.find('form').trigger('submit')

        expect(listClient.updateList)
            .not.toHaveBeenCalled()
    })

    it('updates form when list prop changes', async () => {
        const wrapper = createWrapper()

        await wrapper.setProps({
            list: {
                id: 999,
                name: 'Another List',
                public: false,
            },
        })

        expect(
            wrapper.find('#list-name').element.value
        ).toBe('Another List')

        expect(
            wrapper.find('#list-public').element.checked
        ).toBe(false)
    })
})
