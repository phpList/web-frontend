import { flushPromises, mount } from '@vue/test-utils'
import CreateAdminAttributeModal from '../../../../../../assets/vue/components/settings/CreateAdminAttributeModal.vue'

const {
    createAttributeDefinitionMock,
} = vi.hoisted(() => ({
    createAttributeDefinitionMock: vi.fn(),
}))

vi.mock('../../../../../../assets/vue/api', () => ({
    adminAttributeClient: {
        createAttributeDefinition: createAttributeDefinitionMock,
    },
}))

const mountComponent = (props = {}) =>
    mount(CreateAdminAttributeModal, {
        props: {
            isOpen: true,
            ...props,
        },
        global: {
            stubs: {
                teleport: true,
            },
        },
    })

describe('CreateAdminAttributeModal', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        createAttributeDefinitionMock.mockResolvedValue({
            id: 1,
        })
    })

    it('renders when open', () => {
        const wrapper = mountComponent()

        expect(wrapper.text()).toContain('Create Attribute')
        expect(wrapper.find('input').exists()).toBe(true)
        expect(wrapper.find('select').exists()).toBe(true)
        expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
    })

    it('resets form each time the modal opens', async () => {
        const wrapper = mountComponent({
            isOpen: false,
        })

        await wrapper.setProps({
            isOpen: true,
        })

        await flushPromises()

        expect(wrapper.find('input').element.value).toBe('')
        expect(wrapper.find('select').element.value).toBe('textline')
        expect(wrapper.find('input[type="checkbox"]').element.checked).toBe(false)
    })

    it('creates an attribute and emits created', async () => {
        const wrapper = mountComponent()

        await wrapper.find('input').setValue('Email')
        await wrapper.find('select').setValue('hidden')
        await wrapper.find('input[type="checkbox"]').setValue(true)

        await wrapper.find('form').trigger('submit.prevent')
        await flushPromises()

        expect(createAttributeDefinitionMock).toHaveBeenCalledWith({
            name: 'Email',
            type: 'hidden',
            required: true,
        })

        expect(wrapper.emitted('created')).toHaveLength(1)
    })

    it('shows an error when creation fails', async () => {
        createAttributeDefinitionMock.mockRejectedValueOnce(
            new Error('Unable to save')
        )

        const wrapper = mountComponent()

        await wrapper.find('input').setValue('Email')
        await wrapper.find('form').trigger('submit.prevent')
        await flushPromises()

        expect(createAttributeDefinitionMock).toHaveBeenCalled()
        expect(wrapper.text()).toContain('Unable to save')
        expect(wrapper.emitted('created')).toBeUndefined()
    })

    it('emits close when cancel is clicked', async () => {
        const wrapper = mountComponent()

        const cancelButton = wrapper
            .findAll('button')
            .find((button) => button.text() === 'Cancel')

        await cancelButton.trigger('click')

        expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('emits close when the X button is clicked', async () => {
        const wrapper = mountComponent()

        const closeButton = wrapper.findAll('button')[0]

        await closeButton.trigger('click')

        expect(wrapper.emitted('close')).toHaveLength(1)
    })
})
