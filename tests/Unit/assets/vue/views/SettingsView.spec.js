import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SettingsView from '../../../../../assets/vue/views/SettingsView.vue'

describe('SettingsView', () => {
    it('renders the AdminLayout and SettingsActionsPanel components', () => {
        const wrapper = mount(SettingsView, {
            global: {
                stubs: {
                    AdminLayout: {
                        template: `
              <div data-test="admin-layout">
                <slot />
              </div>
            `,
                    },
                    SettingsActionsPanel: {
                        template: '<div data-test="settings-actions-panel" />',
                    },
                },
            },
        })

        expect(wrapper.find('[data-test="admin-layout"]').exists()).toBe(true)
        expect(wrapper.find('[data-test="settings-actions-panel"]').exists()).toBe(true)
    })
})
