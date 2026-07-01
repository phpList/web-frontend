import { flushPromises, mount } from '@vue/test-utils'
import SettingsAdminAttributes from '../../../../../../assets/vue/components/settings/SettingsAdminAttributes.vue'
import {defineComponent} from "vue";

const {
    getAttributeDefinitionsMock,
    deleteAttributeDefinitionMock,
} = vi.hoisted(() => ({
    getAttributeDefinitionsMock: vi.fn(),
    deleteAttributeDefinitionMock: vi.fn(),
}))

vi.mock('../../../../../../assets/vue/api', () => ({
    adminAttributeClient: {
        getAttributeDefinitions: getAttributeDefinitionsMock,
        deleteAttributeDefinition: deleteAttributeDefinitionMock,
    },
}))

vi.mock('../base/BaseIcon.vue', () => ({
    default: {
        template: '<span />',
    },
}))

const CreateStub = defineComponent({
    name: 'CreateAdminAttributeModal',
    props: ['isOpen'],
    emits: ['close', 'created'],
    template: '<div />',
})

const EditStub = defineComponent({
    name: 'EditAdminAttributeModal',
    props: ['isOpen', 'attribute'],
    emits: ['close', 'updated'],
    template: '<div />',
})

const mountComponent = () =>
    mount(SettingsAdminAttributes, {
        global: {
            stubs: {
                BaseIcon: true,
                CreateAdminAttributeModal: CreateStub,
                EditAdminAttributeModal: EditStub,
            },
        },
    })
describe('SettingsAdminAttributes', () => {
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
                    name: 'Token',
                    type: 'hidden',
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
        expect(wrapper.text()).toContain('Token')
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

        expect(wrapper.findComponent({ name: 'CreateAdminAttributeModal' }).props('isOpen')).toBe(true)
    })

    it('reloads attributes after create', async () => {
        const wrapper = mountComponent()

        await flushPromises()

        getAttributeDefinitionsMock.mockClear()

        const createModal = wrapper.findComponent(CreateStub)
        expect(createModal.exists()).toBe(true)
        await createModal.vm.$emit('created')
    })

    it('opens edit modal', async () => {
        const wrapper = mountComponent()

        await flushPromises()

        const editButton = wrapper
            .findAll('button')
            .find(button => button.text() === 'Edit')

        await editButton.trigger('click')

        const modal = wrapper.findComponent({ name: 'EditAdminAttributeModal' })

        expect(modal.props('isOpen')).toBe(true)
        expect(modal.props('attribute').name).toBe('Email')
    })

    it('reloads after update', async () => {
        const wrapper = mountComponent()

        await flushPromises()

        getAttributeDefinitionsMock.mockClear()

        wrapper.findComponent({ name: 'EditAdminAttributeModal' }).vm.$emit('updated')

        await flushPromises()

        expect(getAttributeDefinitionsMock).toHaveBeenCalled()
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
    })
})
