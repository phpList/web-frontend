import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import SettingsAdmins from '../../../../../../assets/vue/components/settings/SettingsAdmins.vue'

const {
    fetchAllAdminsMock,
    deleteAdministratorMock,
} = vi.hoisted(() => ({
    fetchAllAdminsMock: vi.fn(),
    deleteAdministratorMock: vi.fn(),
}))

vi.mock('../../../../../../assets/vue/api', () => ({
    fetchAllAdmins: fetchAllAdminsMock,
    adminClient: {
        deleteAdministrator: deleteAdministratorMock,
    },
}))

vi.mock('../base/BaseIcon.vue', () => ({
    default: {
        template: '<span />',
    },
}))

vi.mock('./CreateAdminModal.vue', () => ({
    default: defineComponent({
        name: 'CreateAdminModal',
        props: ['isOpen'],
        emits: ['close', 'created'],
        template: '<div />',
    }),
}))

vi.mock('./EditAdminModal.vue', () => ({
    default: defineComponent({
        name: 'EditAdminModal',
        props: ['isOpen', 'admin'],
        emits: ['close', 'updated'],
        template: '<div />',
    }),
}))

const mountComponent = () => mount(SettingsAdmins)

describe('SettingsAdmins', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        fetchAllAdminsMock.mockResolvedValue([
            {
                id: 1,
                loginName: 'admin',
                email: 'admin@example.com',
                superUser: true,
                createdAt: '2024-01-01T00:00:00Z',
            },
            {
                id: 2,
                loginName: 'editor',
                email: 'editor@example.com',
                superUser: false,
                createdAt: '2024-01-02T00:00:00Z',
            },
        ])

        deleteAdministratorMock.mockResolvedValue()

        vi.spyOn(window, 'confirm').mockImplementation(() => true)
        vi.spyOn(window, 'alert').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    it('loads administrators on mount', async () => {
        const wrapper = mountComponent()

        await flushPromises()

        expect(fetchAllAdminsMock).toHaveBeenCalled()
        expect(wrapper.text()).toContain('admin')
        expect(wrapper.text()).toContain('editor')
    })

    it('shows empty state', async () => {
        fetchAllAdminsMock.mockResolvedValueOnce([])

        const wrapper = mountComponent()

        await flushPromises()

        expect(wrapper.text()).toContain('No administrators found')
    })

    it('shows load error', async () => {
        fetchAllAdminsMock.mockRejectedValueOnce(
            new Error('Load failed')
        )

        const wrapper = mountComponent()

        await flushPromises()

        expect(wrapper.text()).toContain('Load failed')
    })

    it('opens the create modal', async () => {
        const wrapper = mountComponent()

        await flushPromises()

        const addButton = wrapper
            .findAll('button')
            .find(button => button.text().includes('Add Admin'))

        await addButton.trigger('click')

        expect(wrapper.findComponent({ name: 'CreateAdminModal' }).props('isOpen')).toBe(true)
    })

    it('opens the edit modal', async () => {
        const wrapper = mountComponent()

        await flushPromises()

        const editButton = wrapper
            .findAll('button')
            .find(button => button.text() === 'Edit')

        await editButton.trigger('click')

        const modal = wrapper.findComponent({ name: 'EditAdminModal' })

        expect(modal.props('isOpen')).toBe(true)
        expect(modal.props('admin').loginName).toBe('admin')
    })

    it('deletes an administrator', async () => {
        const wrapper = mountComponent()

        await flushPromises()

        const deleteButton = wrapper
            .findAll('button')
            .find(button => button.text() === 'Delete')

        await deleteButton.trigger('click')

        expect(window.confirm).toHaveBeenCalled()
        expect(deleteAdministratorMock).toHaveBeenCalledWith(1)
        expect(fetchAllAdminsMock).toHaveBeenCalledTimes(2)
    })

    it('does not delete when confirmation is cancelled', async () => {
        window.confirm.mockReturnValueOnce(false)

        const wrapper = mountComponent()

        await flushPromises()

        const deleteButton = wrapper
            .findAll('button')
            .find(button => button.text() === 'Delete')

        await deleteButton.trigger('click')

        expect(deleteAdministratorMock).not.toHaveBeenCalled()
    })

    it('shows alert when delete fails', async () => {
        deleteAdministratorMock.mockRejectedValueOnce(
            new Error('Delete failed')
        )

        const wrapper = mountComponent()

        await flushPromises()

        const deleteButton = wrapper
            .findAll('button')
            .find(button => button.text() === 'Delete')

        await deleteButton.trigger('click')
        await flushPromises()

        expect(window.alert).toHaveBeenCalledWith(
            'Failed to delete administrator: Delete failed'
        )
    })

    it('formats the created date', async () => {
        const wrapper = mountComponent()

        await flushPromises()

        expect(wrapper.text()).toContain('Jan')
        expect(wrapper.text()).toContain('2024')
    })
})
