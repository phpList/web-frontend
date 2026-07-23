// ListDirectory.spec.js

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ListDirectory from '../../../../../../assets/vue/components/lists/ListDirectory.vue'
import { fetchAllLists, listClient } from '../../../../../../assets/vue/api'

const pushMock = vi.fn()

vi.mock('vue-router', () => ({
    useRouter: () => ({
        push: pushMock,
    }),
}))

vi.mock('../../../../../../assets/vue/api', () => ({
    fetchAllLists: vi.fn(),
    listClient: {
        deleteList: vi.fn(),
    },
}))

const BaseIconStub = {
    template: '<span />',
}

const CreateListModalStub = {
    name: 'CreateListModal',
    props: ['isOpen'],
    template: '<div class="create-modal" />',
}

const EditListModalStub = {
    name: 'EditListModal',
    props: ['isOpen', 'list'],
    template: '<div class="edit-modal" />',
}

const AddSubscribersModalStub = {
    name: 'AddSubscribersModal',
    props: ['isOpen', 'list'],
    template: '<div class="add-subscribers-modal" />',
}

const createWrapper = () =>
    mount(ListDirectory, {
        global: {
            stubs: {
                BaseIcon: BaseIconStub,
                CreateListModal: CreateListModalStub,
                EditListModal: EditListModalStub,
                AddSubscribersModal: AddSubscribersModalStub,
            },
        },
    })

describe('ListDirectory', () => {
    const lists = [
        {
            id: 1,
            name: 'Newsletter',
            public: true,
        },
        {
            id: 2,
            name: 'Customers',
            public: false,
        },
    ]

    beforeEach(() => {
        vi.clearAllMocks()
        window.confirm = vi.fn()
    })

    it('loads mailing lists on mount', async () => {
        fetchAllLists.mockResolvedValue(lists)

        const wrapper = createWrapper()

        await flushPromises()

        expect(fetchAllLists).toHaveBeenCalled()
        expect(wrapper.text()).toContain('Newsletter')
        expect(wrapper.text()).toContain('Customers')
    })

    it('shows fetch errors', async () => {
        fetchAllLists.mockRejectedValue(
            new Error('Failed to load')
        )

        const wrapper = createWrapper()

        await flushPromises()

        expect(wrapper.text()).toContain(
            'Failed to load'
        )
    })

    it('opens create modal', async () => {
        fetchAllLists.mockResolvedValue([])

        const wrapper = createWrapper()

        await flushPromises()

        await wrapper
            .find('button')
            .trigger('click')

        const modal =
            wrapper.findComponent(CreateListModalStub)

        expect(modal.props('isOpen')).toBe(true)
    })

    it('opens edit modal', async () => {
        fetchAllLists.mockResolvedValue(lists)

        const wrapper = createWrapper()

        await flushPromises()

        const editButton = wrapper
            .findAll('button')
            .find(btn => btn.text().includes('Edit'))

        await editButton.trigger('click')

        const modal =
            wrapper.findComponent(EditListModalStub)

        expect(modal.props('isOpen')).toBe(true)
        expect(modal.props('list')).toEqual(lists[0])

        expect(wrapper.emitted('edit')).toEqual([
            [lists[0]],
        ])
    })

    it('opens add subscribers modal', async () => {
        fetchAllLists.mockResolvedValue(lists)

        const wrapper = createWrapper()

        await flushPromises()

        const button = wrapper
            .findAll('button')
            .find(btn =>
                btn.text().includes('Add Subscribers')
            )

        await button.trigger('click')

        const modal =
            wrapper.findComponent(AddSubscribersModalStub)

        expect(modal.props('isOpen')).toBe(true)
        expect(modal.props('list')).toEqual(lists[0])

        expect(wrapper.emitted('add-subscriber'))
            .toEqual([[lists[0]]])
    })

    it('emits start-campaign', async () => {
        fetchAllLists.mockResolvedValue(lists)

        const wrapper = createWrapper()

        await flushPromises()

        const button = wrapper
            .findAll('button')
            .find(btn =>
                btn.text().includes('Start Campaign')
            )

        await button.trigger('click')

        expect(wrapper.emitted('start-campaign'))
            .toEqual([[lists[0]]])
    })

    it('navigates to members page', async () => {
        fetchAllLists.mockResolvedValue(lists)

        const wrapper = createWrapper()

        await flushPromises()

        const button = wrapper
            .findAll('button')
            .find(btn =>
                btn.text().includes('View Members')
            )

        await button.trigger('click')

        expect(pushMock).toHaveBeenCalledWith({
            name: 'list-subscribers',
            params: {
                listId: 1,
            },
            query: {
                listName: 'Newsletter',
            },
        })
    })

    it('deletes a list after confirmation', async () => {
        fetchAllLists.mockResolvedValue(lists)
        listClient.deleteList.mockResolvedValue()

        window.confirm.mockReturnValue(true)

        const wrapper = createWrapper()

        await flushPromises()

        const button = wrapper
            .findAll('button')
            .find(btn =>
                btn.text().includes('Delete')
            )

        await button.trigger('click')

        expect(listClient.deleteList)
            .toHaveBeenCalledWith(1)

        expect(fetchAllLists)
            .toHaveBeenCalledTimes(2)
    })

    it('does not delete when confirmation is cancelled', async () => {
        fetchAllLists.mockResolvedValue(lists)

        window.confirm.mockReturnValue(false)

        const wrapper = createWrapper()

        await flushPromises()

        const button = wrapper
            .findAll('button')
            .find(btn =>
                btn.text().includes('Delete')
            )

        await button.trigger('click')

        expect(listClient.deleteList)
            .not.toHaveBeenCalled()
    })

    it('refreshes after list created', async () => {
        fetchAllLists.mockResolvedValue(lists)

        const wrapper = createWrapper()

        await flushPromises()

        await wrapper
            .findComponent(CreateListModalStub)
            .vm.$emit('created')

        await flushPromises()

        expect(fetchAllLists)
            .toHaveBeenCalledTimes(2)
    })

    it('refreshes after list updated', async () => {
        fetchAllLists.mockResolvedValue(lists)

        const wrapper = createWrapper()

        await flushPromises()

        await wrapper
            .findComponent(EditListModalStub)
            .vm.$emit('updated')

        await flushPromises()

        expect(fetchAllLists)
            .toHaveBeenCalledTimes(2)
    })

    it('refreshes after subscribers added', async () => {
        fetchAllLists.mockResolvedValue(lists)

        const wrapper = createWrapper()

        await flushPromises()

        await wrapper
            .findComponent(AddSubscribersModalStub)
            .vm.$emit('added')

        await flushPromises()

        expect(fetchAllLists)
            .toHaveBeenCalledTimes(2)
    })

    it('correctly identifies public lists', async () => {
        fetchAllLists.mockResolvedValue([
            { id: 1, name: 'A', public: 1 },
            { id: 2, name: 'B', public: '1' },
        ])

        const wrapper = createWrapper()

        await flushPromises()

        expect(wrapper.text()).toContain('Yes')
    })
})
