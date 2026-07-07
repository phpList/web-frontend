import { flushPromises, mount } from '@vue/test-utils'
import EditAdminAttributeModal from '../../../../../../assets/vue/components/settings/EditAdminAttributeModal.vue'

const {
    updateAttributeDefinitionMock,
} = vi.hoisted(() => ({
    updateAttributeDefinitionMock: vi.fn(),
}))

vi.mock('../../../../../../assets/vue/api', () => ({
    adminAttributeClient: {
        updateAttributeDefinition: updateAttributeDefinitionMock,
    },
}))

const attribute = {
    id: 1,
    name: 'Email',
    type: 'textline',
    required: true,
}

const mountComponent = (props = {}) =>
    mount(EditAdminAttributeModal, {
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

describe('EditAdminAttributeModal', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        updateAttributeDefinitionMock.mockResolvedValue({
            id: 1,
        })
    })

    it('renders when open', () => {
        const wrapper = mountComponent()

        expect(wrapper.text()).toContain('Edit Attribute')
        expect(wrapper.find('input').exists()).toBe(true)
        expect(wrapper.find('select').exists()).toBe(true)
    })

    it('populates the form from the attribute prop', () => {
        const wrapper = mountComponent()

        const inputs = wrapper.findAll('input')

        expect(inputs[0].element.value).toBe('Email')
        expect(wrapper.find('select').element.value).toBe('textline')
        expect(inputs[1].element.checked).toBe(true)
    })

    it('updates the form when the attribute prop changes', async () => {
        const wrapper = mountComponent()

        await wrapper.setProps({
            attribute: {
                id: 2,
                name: 'Country',
                type: 'hidden',
                required: false,
            },
        })

        await flushPromises()

        const inputs = wrapper.findAll('input')

        expect(inputs[0].element.value).toBe('Country')
        expect(wrapper.find('select').element.value).toBe('hidden')
        expect(inputs[1].element.checked).toBe(false)
    })

    it('updates an attribute and emits updated', async () => {
        const wrapper = mountComponent()

        const inputs = wrapper.findAll('input')

        await inputs[0].setValue('Full Name')
        await wrapper.find('select').setValue('hidden')
        await inputs[1].setValue(false)

        await wrapper.find('form').trigger('submit.prevent')
        await flushPromises()

        expect(updateAttributeDefinitionMock).toHaveBeenCalledWith(1, {
            name: 'Full Name',
            type: 'hidden',
            required: false,
        })

        expect(wrapper.emitted('updated')).toHaveLength(1)
    })

    it('shows an error when update fails', async () => {
        updateAttributeDefinitionMock.mockRejectedValueOnce(
            new Error('Unable to update')
        )

        const wrapper = mountComponent()

        await wrapper.find('form').trigger('submit.prevent')
        await flushPromises()

        expect(updateAttributeDefinitionMock).toHaveBeenCalled()
        expect(wrapper.text()).toContain('Unable to update')
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
