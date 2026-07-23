import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TemplatesView from '../../../../../assets/vue/views/TemplatesView.vue'

describe('TemplatesView', () => {
    it('renders the AdminLayout and TemplateLibrary components', () => {
        const wrapper = mount(TemplatesView, {
            global: {
                stubs: {
                    AdminLayout: {
                        template: `
              <div data-test="admin-layout">
                <slot />
              </div>
            `,
                    },
                    TemplateLibrary: {
                        template: '<div data-test="template-library" />',
                    },
                },
            },
        })

        expect(wrapper.find('[data-test="admin-layout"]').exists()).toBe(true)
        expect(wrapper.find('[data-test="template-library"]').exists()).toBe(true)
    })
})
