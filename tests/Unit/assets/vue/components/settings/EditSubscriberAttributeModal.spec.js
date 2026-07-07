import { flushPromises, mount } from '@vue/test-utils'
import EditSubscriberAttributeModal from '../../../../../../assets/vue/components/settings/EditSubscriberAttributeModal.vue'

const {
    updateAttributeDefinitionMock,
} = vi.hoisted(() => ({
    updateAttributeDefinitionMock: vi.fn(),
}))

vi.mock('../../../../../../assets/vue/api', () => ({
    subscriberAttributesClient: {
        updateAttributeDefinition: updateAttributeDefinitionMock,
    },
}))

vi.mock('../base/BaseIcon.vue', () => ({
    default: {
        template: '<span />',
    },
}))

const attribute = {
    id: 1,
    name: 'Country',
    type: 'select',
    order: 5,
    default_value: 'USA',
    required: true,
    options: [
        {
            name: 'USA',
            list_order: 1,
        },
        {
            name: 'Canada',
            list_order: 2,
        },
    ],
}

const mountComponent = (props = {}) =>
    mount(EditSubscriberAttributeModal, {
        props: {
            isOpen: true,
            attribute,
            ...props,
        },
        global: {
            stubs: {
                teleport: true,
            },
        },
    })

describe('EditSubscriberAttributeModal', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        updateAttributeDefinitionMock.mockResolvedValue({
            id: 1,
        })
    })

    it('renders when open', () => {
        const wrapper = mountComponent()

        expect(wrapper.text()).toContain('Edit Subscriber Attribute')
        expect(wrapper.find('select').exists()).toBe(true)
    })

    it('populates the form from the attribute prop', () => {
        const wrapper = mountComponent()

        const inputs = wrapper.findAll('input')

        expect(inputs[0].element.value).toBe('Country')
        expect(wrapper.find('select').element.value).toBe('select')
        expect(inputs[1].element.value).toBe('5')
        expect(inputs[2].element.value).toBe('USA')
        expect(inputs[3].element.checked).toBe(true)
    })

    it('updates the attribute', async () => {
        const wrapper = mountComponent()

        const inputs = wrapper.findAll('input')

        await inputs[0].setValue('Status')
        await inputs[1].setValue('10')
        await inputs[2].setValue('Active')
        await inputs[3].setValue(false)

        await wrapper.find('form').trigger('submit.prevent')
        await flushPromises()

        expect(updateAttributeDefinitionMock).toHaveBeenCalledWith(
            1,
            expect.objectContaining({
                id: 1,
                name: 'Status',
                type: 'select',
                order: 10,
                default_value: 'Active',
                required: false,
            })
        )

        expect(wrapper.emitted('updated')).toHaveLength(1)
        expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('adds and removes options', async () => {
        const wrapper = mountComponent()

        const addButton = wrapper
            .findAll('button')
            .find(button => button.text() === 'Add')

        await addButton.trigger('click')

        expect(wrapper.findAll('input').length).toBe(10)

        const removeButtons = wrapper
            .findAll('button')
            .filter(button => button.text().trim() === '')

        await removeButtons[0].trigger('click')

        expect(wrapper.findAll('input').length).toBe(8)
    })

    it('updates option values', async () => {
        const wrapper = mountComponent()

        const inputs = wrapper.findAll('input')

        await inputs[4].setValue('UK')
        await inputs[5].setValue('3')

        await wrapper.find('form').trigger('submit.prevent')
        await flushPromises()

        const payload = updateAttributeDefinitionMock.mock.calls[0][1]

        expect(payload.options[0]).toEqual({
            name: 'UK',
            list_order: 3,
        })
    })

    it('shows an error when update fails', async () => {
        updateAttributeDefinitionMock.mockRejectedValueOnce(
            new Error('Update failed')
        )

        const wrapper = mountComponent()

        await wrapper.find('form').trigger('submit.prevent')
        await flushPromises()

        expect(updateAttributeDefinitionMock).toHaveBeenCalled()
        expect(wrapper.text()).toContain('Update failed')
        expect(wrapper.emitted('updated')).toBeUndefined()
    })

    it('emits close when cancel is clicked', async () => {
        const wrapper = mountComponent()

        const cancelButton = wrapper
            .findAll('button')
            .find(button => button.text() === 'Cancel')

        await cancelButton.trigger('click')

        expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('emits close when the X button is clicked', async () => {
        const wrapper = mountComponent()

        await wrapper.findAll('button')[0].trigger('click')

        expect(wrapper.emitted('close')).toHaveLength(1)
    })
})
