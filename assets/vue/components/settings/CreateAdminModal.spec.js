import { flushPromises, mount } from '@vue/test-utils'
import CreateAdminModal from './CreateAdminModal.vue'

const {
    createAdministratorMock,
} = vi.hoisted(() => ({
    createAdministratorMock: vi.fn(),
}))

vi.mock('@tatevikgr/rest-api-client', () => ({
    Requests: {
        CreateAdministratorRequest: class {
            constructor(login_name, password, email, super_user, privileges) {
                this.login_name = login_name
                this.password = password
                this.email = email
                this.super_user = super_user
                this.privileges = privileges
            }
        },
    },
}))

vi.mock('../../api', () => ({
    adminClient: {
        createAdministrator: createAdministratorMock,
    },
}))

vi.mock('../base/BaseIcon.vue', () => ({
    default: {
        template: '<span />',
    },
}))

const mountComponent = (props = {}) =>
    mount(CreateAdminModal, {
        props: {
            isOpen: true,
            ...props,
        },
    })

describe('CreateAdminModal', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        createAdministratorMock.mockResolvedValue({
            id: 1,
            login_name: 'admin',
        })

        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    it('renders when open', () => {
        const wrapper = mountComponent()

        expect(wrapper.text()).toContain('Create New Administrator')
        expect(wrapper.find('#admin-login-name').exists()).toBe(true)
        expect(wrapper.find('#admin-email').exists()).toBe(true)
        expect(wrapper.find('#admin-password').exists()).toBe(true)
    })

    it('resets form whenever opened', async () => {
        const wrapper = mountComponent({
            isOpen: false,
        })

        await wrapper.setProps({
            isOpen: true,
        })

        await flushPromises()

        expect(wrapper.find('#admin-login-name').element.value).toBe('')
        expect(wrapper.find('#admin-email').element.value).toBe('')
        expect(wrapper.find('#admin-password').element.value).toBe('')
        expect(wrapper.find('#admin-super-user').element.checked).toBe(false)
    })

    it('creates an administrator', async () => {
        const wrapper = mountComponent()

        await wrapper.find('#admin-login-name').setValue('admin')
        await wrapper.find('#admin-email').setValue('admin@example.com')
        await wrapper.find('#admin-password').setValue('password123')

        await wrapper.find('form').trigger('submit.prevent')
        await flushPromises()

        expect(createAdministratorMock).toHaveBeenCalledTimes(1)

        const request = createAdministratorMock.mock.calls[0][0]

        expect(request.login_name).toBe('admin')
        expect(request.email).toBe('admin@example.com')
        expect(request.password).toBe('password123')
        expect(request.super_user).toBe(false)
        expect(request.privileges).toEqual({
            subscribers: false,
            campaigns: false,
            statistics: false,
            settings: false,
        })

        expect(wrapper.emitted('created')).toHaveLength(1)
        expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('creates a super user without privileges', async () => {
        const wrapper = mountComponent()

        await wrapper.find('#admin-login-name').setValue('admin')
        await wrapper.find('#admin-email').setValue('admin@example.com')
        await wrapper.find('#admin-password').setValue('password123')
        await wrapper.find('#admin-super-user').setValue(true)

        await wrapper.find('form').trigger('submit.prevent')
        await flushPromises()

        const request = createAdministratorMock.mock.calls[0][0]

        expect(request.super_user).toBe(true)
        expect(request.privileges).toBeUndefined()
    })

    it('does not submit when form is invalid', async () => {
        const wrapper = mountComponent()

        await wrapper.find('#admin-login-name').setValue('ab')
        await wrapper.find('#admin-email').setValue('invalid')
        await wrapper.find('#admin-password').setValue('123')

        await wrapper.find('form').trigger('submit.prevent')
        await flushPromises()

        expect(createAdministratorMock).not.toHaveBeenCalled()
    })

    it('shows an error when creation fails', async () => {
        createAdministratorMock.mockRejectedValueOnce(
            new Error('Create failed')
        )

        const wrapper = mountComponent()

        await wrapper.find('#admin-login-name').setValue('admin')
        await wrapper.find('#admin-email').setValue('admin@example.com')
        await wrapper.find('#admin-password').setValue('password123')

        await wrapper.find('form').trigger('submit.prevent')
        await flushPromises()

        expect(createAdministratorMock).toHaveBeenCalled()
        expect(wrapper.text()).toContain('Create failed')
        expect(console.error).toHaveBeenCalled()
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

    it('emits close when the close button is clicked', async () => {
        const wrapper = mountComponent()

        await wrapper.find('button[type="button"]').trigger('click')

        expect(wrapper.emitted('close')).toHaveLength(1)
    })
})
