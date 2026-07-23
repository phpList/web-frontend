import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import SettingsSubscriberAttributes from '../../../../../../assets/vue/components/settings/SettingsSubscriberAttributes.vue'

const {
    getAttributeDefinitionsMock,
    deleteAttributeDefinitionMock,
} = vi.hoisted(() => ({
    getAttributeDefinitionsMock: vi.fn(),
    deleteAttributeDefinitionMock: vi.fn(),
}))

vi.mock('../../../../../../assets/vue/api', () => ({
    subscriberAttributesClient: {
        getAttributeDefinitions: getAttributeDefinitionsMock,
        deleteAttributeDefinition: deleteAttributeDefinitionMock,
    },
}))

vi.mock('../base/BaseIcon.vue', () => ({
    default: {
        template: '<span />',
    },
}))

vi.mock('./CreateSubscriberAttributeModal.vue', () => ({
    default: defineComponent({
        name: 'CreateSubscriberAttributeModal',
        props: ['isOpen'],
        emits: ['close', 'created'],
        template: '<div />',
    }),
}))

vi.mock('./EditSubscriberAttributeModal.vue', () => ({
    default: defineComponent({
        name: 'EditSubscriberAttributeModal',
        props: ['isOpen', 'attribute'],
        emits: ['close', 'updated'],
        template: '<div />',
    }),
}))

const mountComponent = () => mount(SettingsSubscriberAttributes)

describe('SettingsSubscriberAttributes', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        getAttributeDefinitionsMock.mockResolvedValue({
            items: [
                {
                    id: 1,
                    name: 'Email',
                    type: 'textline',
                    required: true,
                },
                {
                    id: 2,
                    name: 'Country',
                    type: 'select',
                    required: false,
                },
            ],
        })

        deleteAttributeDefinitionMock.mockResolvedValue()

        vi.spyOn(window, 'confirm').mockImplementation(() => true)
        vi.spyOn(window, 'alert').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    it('loads attributes on mount', async () => {
        const wrapper = mountComponent()

        await flushPromises()

        expect(getAttributeDefinitionsMock).toHaveBeenCalled()
        expect(wrapper.text()).toContain('Email')
        expect(wrapper.text()).toContain('Country')
    })

    it('shows empty state', async () => {
        getAttributeDefinitionsMock.mockResolvedValueOnce({
            items: [],
        })

        const wrapper = mountComponent()

        await flushPromises()

        expect(wrapper.text()).toContain('No attributes found.')
    })

    it('shows load error', async () => {
        getAttributeDefinitionsMock.mockRejectedValueOnce(
            new Error('Load failed')
        )

        const wrapper = mountComponent()

        await flushPromises()

        expect(wrapper.text()).toContain('Load failed')
    })

    it('opens create modal', async () => {
        const wrapper = mountComponent()

        await flushPromises()

        const addButton = wrapper
            .findAll('button')
            .find(button => button.text().includes('Add Attribute'))

        await addButton.trigger('click')

        const modal = wrapper.findComponent({ name: 'CreateSubscriberAttributeModal' })

        expect(modal.exists()).toBe(true)
        expect(modal.props('isOpen')).toBe(true)
    })

    it('opens edit modal', async () => {
        const wrapper = mountComponent()

        await flushPromises()

        const editButton = wrapper
            .findAll('button')
            .find(button => button.text() === 'Edit')

        await editButton.trigger('click')

        const modal = wrapper.findComponent({ name: 'EditSubscriberAttributeModal' })

        expect(modal.exists()).toBe(true)
        expect(modal.props('isOpen')).toBe(true)
        expect(modal.props('attribute')).toEqual({
            id: 1,
            name: 'Email',
            type: 'textline',
            required: true,
        })
    })

    it('deletes an attribute after confirmation', async () => {
        const wrapper = mountComponent()

        await flushPromises()

        const deleteButton = wrapper
            .findAll('button')
            .find(button => button.text() === 'Delete')

        await deleteButton.trigger('click')

        expect(window.confirm).toHaveBeenCalled()
        expect(deleteAttributeDefinitionMock).toHaveBeenCalledWith(1)
        expect(getAttributeDefinitionsMock).toHaveBeenCalledTimes(2)
    })

    it('does not delete when confirmation is cancelled', async () => {
        window.confirm.mockReturnValueOnce(false)

        const wrapper = mountComponent()

        await flushPromises()

        const deleteButton = wrapper
            .findAll('button')
            .find(button => button.text() === 'Delete')

        await deleteButton.trigger('click')

        expect(deleteAttributeDefinitionMock).not.toHaveBeenCalled()
    })

    it('shows alert when delete fails', async () => {
        deleteAttributeDefinitionMock.mockRejectedValueOnce(
            new Error('Delete failed')
        )

        const wrapper = mountComponent()

        await flushPromises()

        const deleteButton = wrapper
            .findAll('button')
            .find(button => button.text() === 'Delete')

        await deleteButton.trigger('click')
        await flushPromises()

        expect(window.alert).toHaveBeenCalledWith('Delete failed')
        expect(console.error).toHaveBeenCalled()
    })
})
