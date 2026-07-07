import { flushPromises, mount } from '@vue/test-utils'
import EditAdminModal from '../../../../../../assets/vue/components/settings/EditAdminModal.vue'

const {
    updateAdministratorMock,
} = vi.hoisted(() => ({
    updateAdministratorMock: vi.fn(),
}))

vi.mock('@tatevikgr/rest-api-client', () => ({
    Requests: {
        UpdateAdministratorRequest: class {
            constructor(loginName, password, email, superUser, privileges) {
                this.loginName = loginName
                this.password = password
                this.email = email
                this.superUser = superUser
                this.privileges = privileges
            }
        },
    },
}))

vi.mock('../../../../../../assets/vue/api', () => ({
    adminClient: {
        updateAdministrator: updateAdministratorMock,
    },
}))

vi.mock('../base/BaseIcon.vue', () => ({
    default: {
        template: '<span />',
    },
}))

const admin = {
    id: 7,
    loginName: 'admin',
    email: 'admin@example.com',
    superUser: false,
    privileges: {
        subscribers: true,
        campaigns: false,
        statistics: true,
        settings: false,
    },
}

const mountComponent = (props = {}) =>
    mount(EditAdminModal, {
        props: {
            isOpen: true,
            admin,
            ...props,
        },
    })

describe('EditAdminModal', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        updateAdministratorMock.mockResolvedValue({
            id: 7,
        })

        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    it('renders when open', () => {
        const wrapper = mountComponent()

        expect(wrapper.text()).toContain('Edit Administrator')
        expect(wrapper.text()).toContain('7')
        expect(wrapper.find('#edit-admin-login-name').exists()).toBe(true)
        expect(wrapper.find('#edit-admin-email').exists()).toBe(true)
        expect(wrapper.find('#edit-admin-password').exists()).toBe(true)
    })

    it('populates the form from the admin prop', async () => {
        const wrapper = mountComponent()

        await flushPromises()

        expect(wrapper.find('#edit-admin-login-name').element.value).toBe('admin')
        expect(wrapper.find('#edit-admin-email').element.value).toBe('admin@example.com')
        expect(wrapper.find('#edit-admin-password').element.value).toBe('')
        expect(wrapper.find('#edit-admin-super-user').element.checked).toBe(false)
        expect(wrapper.find('#edit-priv-subscribers').element.checked).toBe(true)
        expect(wrapper.find('#edit-priv-statistics').element.checked).toBe(true)
    })

    it('updates the form when the admin prop changes', async () => {
        const wrapper = mountComponent()

        await wrapper.setProps({
            admin: {
                id: 9,
                loginName: 'root',
                email: 'root@example.com',
                superUser: true,
                privileges: {
                    subscribers: false,
                    campaigns: true,
                    statistics: false,
                    settings: true,
                },
            },
        })

        await flushPromises()

        expect(wrapper.find('#edit-admin-login-name').element.value).toBe('root')
        expect(wrapper.find('#edit-admin-email').element.value).toBe('root@example.com')
        expect(wrapper.find('#edit-admin-super-user').element.checked).toBe(true)
        expect(wrapper.find('#edit-priv-campaigns').element.checked).toBe(true)
        expect(wrapper.find('#edit-priv-settings').element.checked).toBe(true)
    })

    it('updates an administrator', async () => {
        const wrapper = mountComponent()

        await wrapper.find('#edit-admin-login-name').setValue('new-admin')
        await wrapper.find('#edit-admin-email').setValue('new@example.com')
        await wrapper.find('#edit-admin-password').setValue('password123')
        await wrapper.find('#edit-admin-super-user').setValue(true)

        await wrapper.find('form').trigger('submit.prevent')
        await flushPromises()

        expect(updateAdministratorMock).toHaveBeenCalledTimes(1)
        expect(updateAdministratorMock.mock.calls[0][0]).toBe(7)

        const request = updateAdministratorMock.mock.calls[0][1]

        expect(request.loginName).toBe('new-admin')
        expect(request.email).toBe('new@example.com')
        expect(request.password).toBe('password123')
        expect(request.superUser).toBe(true)
        expect(request.privileges).toEqual({
            subscribers: true,
            campaigns: false,
            statistics: true,
            settings: false,
        })

        expect(wrapper.emitted('updated')).toHaveLength(1)
        expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('does not submit without an admin', async () => {
        const wrapper = mountComponent({
            admin: null,
        })

        await wrapper.find('form').trigger('submit.prevent')
        await flushPromises()

        expect(updateAdministratorMock).not.toHaveBeenCalled()
    })

    it('shows an error when update fails', async () => {
        updateAdministratorMock.mockRejectedValueOnce(
            new Error('Update failed')
        )

        const wrapper = mountComponent()

        await wrapper.find('form').trigger('submit.prevent')
        await flushPromises()

        expect(updateAdministratorMock).toHaveBeenCalled()
        expect(wrapper.text()).toContain('Update failed')
        expect(console.error).toHaveBeenCalled()
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

    it('emits close when the close button is clicked', async () => {
        const wrapper = mountComponent()

        await wrapper.find('button[aria-label="Close edit administrator modal"]').trigger('click')

        expect(wrapper.emitted('close')).toHaveLength(1)
    })
})
