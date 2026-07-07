import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PublicPageEditView from '../../../../../assets/vue/views/PublicPageEditView.vue'

describe('PublicPageView', () => {
    it('renders the AdminLayout and PublicPageEditor components', () => {
        const wrapper = mount(PublicPageEditView, {
            global: {
                stubs: {
                    AdminLayout: {
                        template: `
              <div data-test="admin-layout">
                <slot />
              </div>
            `,
                    },
                    PublicPageEditor: {
                        template: '<div data-test="public-page-editor" />',
                    },
                },
            },
        })

        expect(wrapper.find('[data-test="admin-layout"]').exists()).toBe(true)
        expect(wrapper.find('[data-test="public-page-editor"]').exists()).toBe(true)
    })
})
