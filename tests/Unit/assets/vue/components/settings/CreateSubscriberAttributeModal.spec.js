import { flushPromises, mount } from '@vue/test-utils'
import CreateSubscriberAttributeModal from '../../../../../../assets/vue/components/settings/CreateSubscriberAttributeModal.vue'

const {
    createAttributeDefinitionMock,
} = vi.hoisted(() => ({
    createAttributeDefinitionMock: vi.fn(),
}))

vi.mock('../../../../../../assets/vue/api', () => ({
    subscriberAttributesClient: {
        createAttributeDefinition: createAttributeDefinitionMock,
    },
}))

vi.mock('../base/BaseIcon.vue', () => ({
    default: {
        template: '<span />',
    },
}))

const mountComponent = (props = {}) =>
    mount(CreateSubscriberAttributeModal, {
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

describe('CreateSubscriberAttributeModal', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        createAttributeDefinitionMock.mockResolvedValue({
            id: 1,
        })
    })

    it('renders when open', () => {
        const wrapper = mountComponent()

        expect(wrapper.text()).toContain('Create Subscriber Attribute')
        expect(wrapper.findAll('input')[0].exists()).toBe(true)
        expect(wrapper.find('select').exists()).toBe(true)
    })

    it('resets the form when reopened', async () => {
        const wrapper = mountComponent({
            isOpen: false,
        })

        await wrapper.setProps({
            isOpen: true,
        })

        await flushPromises()

        const inputs = wrapper.findAll('input')

        expect(inputs[0].element.value).toBe('')
        expect(wrapper.find('select').element.value).toBe('textline')
        expect(inputs[2].element.checked).toBe(false)
    })

    it('creates a subscriber attribute', async () => {
        const wrapper = mountComponent()

        const inputs = wrapper.findAll('input')

        await inputs[0].setValue('Country')
        await wrapper.find('select').setValue('textline')
        await inputs[1].setValue('10')
        await inputs[2].setValue('Default')

        await wrapper.find('form').trigger('submit.prevent')
        await flushPromises()

        expect(createAttributeDefinitionMock).toHaveBeenCalledWith({
            name: 'Country',
            type: 'textline',
            order: 10,
            default_value: 'Default',
            required: false,
            options: [],
        })

        expect(wrapper.emitted('created')).toHaveLength(1)
        expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('adds and removes options', async () => {
        const wrapper = mountComponent()

        await wrapper.find('select').setValue('select')

        const addButton = wrapper
            .findAll('button')
            .find(button => button.text() === 'Add')

        await addButton.trigger('click')

        expect(wrapper.findAll('input').length).toBeGreaterThan(4)

        const removeButton = wrapper
            .findAll('button')
            .find(button => !button.text().trim())

        await removeButton.trigger('click')

        expect(wrapper.findAll('input').length).toBe(4)
    })

    it('submits options for selectable types', async () => {
        const wrapper = mountComponent()

        await wrapper.findAll('input')[0].setValue('Status')
        await wrapper.find('select').setValue('select')

        const addButton = wrapper
            .findAll('button')
            .find(button => button.text() === 'Add')

        await addButton.trigger('click')

        const inputs = wrapper.findAll('input')

        await inputs[4].setValue('Active')
        await inputs[5].setValue('1')

        await wrapper.find('form').trigger('submit.prevent')
        await flushPromises()

        expect(createAttributeDefinitionMock).toHaveBeenCalledWith({
            name: 'Status',
            type: 'select',
            order: null,
            default_value: '',
            required: false,
            options: [
                {
                    name: 'Active',
                    list_order: 1,
                },
            ],
        })
    })

    it('shows an error when creation fails', async () => {
        createAttributeDefinitionMock.mockRejectedValueOnce(
            new Error('Unable to save')
        )

        const wrapper = mountComponent()

        await wrapper.findAll('input')[0].setValue('Country')

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
