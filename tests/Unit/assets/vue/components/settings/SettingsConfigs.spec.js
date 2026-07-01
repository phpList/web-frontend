import { flushPromises, mount } from '@vue/test-utils'
import SettingsConfigs from '../../../../../../assets/vue/components/settings/SettingsConfigs.vue'

const {
    getConfigsMock,
    updateMock,
} = vi.hoisted(() => ({
    getConfigsMock: vi.fn(),
    updateMock: vi.fn(),
}))

vi.mock('../../../../../../assets/vue/api', () => ({
    default: {},
    configClient: {
        getConfigs: getConfigsMock,
        update: updateMock,
    },
}))

const mountComponent = () => mount(SettingsConfigs)

describe('SettingsConfigs', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        vi.useFakeTimers()

        getConfigsMock.mockResolvedValue({
            items: [
                {
                    key: 'site_name',
                    value: 'Newsletter',
                    editable: true,
                    description: 'Site title',
                },
                {
                    key: 'version',
                    value: '1.0.0',
                    editable: false,
                },
            ],
        })

        updateMock.mockImplementation((key, value) =>
            Promise.resolve({
                key,
                value,
                editable: true,
            })
        )

        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        vi.runOnlyPendingTimers()
        vi.useRealTimers()
    })

    it('loads configs on mount', async () => {
        const wrapper = mountComponent()

        await flushPromises()

        expect(getConfigsMock).toHaveBeenCalled()
        expect(wrapper.text()).toContain('site_name')
        expect(wrapper.text()).toContain('version')
    })

    it('refreshes configs', async () => {
        const wrapper = mountComponent()

        await flushPromises()

        getConfigsMock.mockClear()

        const refresh = wrapper
            .findAll('button')
            .find(b => b.text() === 'Refresh')

        await refresh.trigger('click')
        await flushPromises()

        expect(getConfigsMock).toHaveBeenCalled()
    })

    it('filters configs', async () => {
        const wrapper = mountComponent()

        await flushPromises()

        await wrapper.find('input[type="search"]').setValue('site')

        expect(wrapper.text()).toContain('site_name')
        expect(wrapper.text()).not.toContain('version')
    })

    it('saves a config', async () => {
        const wrapper = mountComponent()

        await flushPromises()

        const valueInput = wrapper.find('input[aria-label="Value for site_name"]')

        await valueInput.setValue('New Name')

        const saveButton = wrapper
            .findAll('button')
            .find(b => b.text() === 'Save')

        await saveButton.trigger('click')
        await flushPromises()

        expect(updateMock).toHaveBeenCalledWith(
            'site_name',
            'New Name'
        )

        expect(wrapper.text()).toContain('Saved')
    })

    it('shows save error', async () => {
        updateMock.mockRejectedValueOnce(
            new Error('Update failed')
        )

        const wrapper = mountComponent()

        await flushPromises()

        const saveButton = wrapper
            .findAll('button')
            .find(b => b.text() === 'Save')

        await saveButton.trigger('click')
        await flushPromises()

        expect(wrapper.text()).toContain('Update failed')
        expect(console.error).toHaveBeenCalled()
    })

    it('resets edited value', async () => {
        const wrapper = mountComponent()

        await flushPromises()

        const valueInput = wrapper.find('input[aria-label="Value for site_name"]')

        await valueInput.setValue('Changed')

        const resetButton = wrapper
            .findAll('button')
            .find(b => b.text() === 'Reset')

        await resetButton.trigger('click')

        expect(valueInput.element.value).toBe('Newsletter')
    })

    it('shows empty state', async () => {
        getConfigsMock.mockResolvedValueOnce({
            items: [],
        })

        const wrapper = mountComponent()

        await flushPromises()

        expect(wrapper.text()).toContain('No configuration keys found.')
    })

    it('shows load error', async () => {
        getConfigsMock.mockRejectedValueOnce(
            new Error('Load failed')
        )

        const wrapper = mountComponent()

        await flushPromises()

        expect(wrapper.text()).toContain('Load failed')
        expect(console.error).toHaveBeenCalled()
    })

    it('renders readonly configs as disabled', async () => {
        const wrapper = mountComponent()

        await flushPromises()

        const input = wrapper.find('input[aria-label="Value for version"]')

        expect(input.attributes('readonly')).toBeDefined()
    })
})
