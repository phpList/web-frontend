import { flushPromises, mount } from '@vue/test-utils'
import SettingsActionsPanel from './SettingsActionsPanel.vue'

const {
    routeMock,
    replaceMock,
} = vi.hoisted(() => ({
    routeMock: {
        query: {},
    },
    replaceMock: vi.fn(() => Promise.resolve()),
}))

vi.mock('vue-router', () => ({
    useRoute: () => routeMock,
    useRouter: () => ({
        replace: replaceMock,
    }),
}))

vi.mock('./SettingsConfigs.vue', () => ({
    default: {
        template: '<div>Configs Panel</div>',
    },
}))

vi.mock('./SettingsAdmins.vue', () => ({
    default: {
        template: '<div>Admins Panel</div>',
    },
}))

vi.mock('./SettingsAdminAttributes.vue', () => ({
    default: {
        template: '<div>Admin Attributes Panel</div>',
    },
}))

vi.mock('./SettingsSubscriberAttributes.vue', () => ({
    default: {
        template: '<div>Subscriber Attributes Panel</div>',
    },
}))

const mountComponent = () => mount(SettingsActionsPanel)

describe('SettingsActionsPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        routeMock.query = {}
    })

    it('renders configs tab by default', async () => {
        const wrapper = mountComponent()

        await flushPromises()

        expect(wrapper.text()).toContain('Settings')
        expect(wrapper.text()).toContain('Configs Panel')

        expect(replaceMock).toHaveBeenCalledWith({
            query: {
                tab: 'configs',
            },
        })
    })

    it('renders admins tab from route query', async () => {
        routeMock.query = {
            tab: 'admins',
        }

        const wrapper = mountComponent()

        await flushPromises()

        expect(wrapper.text()).toContain('Admins Panel')
        expect(replaceMock).not.toHaveBeenCalled()
    })

    it('falls back to configs for an invalid tab', async () => {
        routeMock.query = {
            tab: 'invalid',
        }

        const wrapper = mountComponent()

        await flushPromises()

        expect(wrapper.text()).toContain('Configs Panel')

        expect(replaceMock).toHaveBeenCalledWith({
            query: {
                tab: 'configs',
            },
        })
    })

    it('changes tabs when a tab button is clicked', async () => {
        const wrapper = mountComponent()

        await flushPromises()

        const button = wrapper
            .findAll('button')
            .find(button => button.text() === 'Admins')

        await button.trigger('click')
        await flushPromises()

        expect(wrapper.text()).toContain('Admins Panel')

        expect(replaceMock).toHaveBeenLastCalledWith({
            query: {
                tab: 'admins',
            },
        })
    })

    it('renders the admin attributes tab', async () => {
        routeMock.query = {
            tab: 'admin_attributes',
        }

        const wrapper = mountComponent()

        await flushPromises()

        expect(wrapper.text()).toContain('Admin Attributes Panel')
    })

    it('renders the subscriber attributes tab', async () => {
        routeMock.query = {
            tab: 'subscriber_attributes',
        }

        const wrapper = mountComponent()

        await flushPromises()

        expect(wrapper.text()).toContain('Subscriber Attributes Panel')
    })

    it('updates the displayed panel when the route query changes', async () => {
        const wrapper = mountComponent()
        await flushPromises()

        const adminsButton = wrapper
            .findAll('button')
            .find(b => b.text() === 'Admins')

        await adminsButton.trigger('click')
        await flushPromises()

        expect(wrapper.text()).toContain('Admins Panel')
        expect(replaceMock).toHaveBeenLastCalledWith({
            query: {
                tab: 'admins',
            },
        })
    })
})
