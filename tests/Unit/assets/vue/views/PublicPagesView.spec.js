import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PublicPagesView from '../../../../../assets/vue/views/PublicPagesView.vue'

describe('PublicPagesView', () => {
    it('renders the AdminLayout and PublicPagesDirectory components', () => {
        const wrapper = mount(PublicPagesView, {
            global: {
                stubs: {
                    AdminLayout: {
                        template: `
              <div data-test="admin-layout">
                <slot />
              </div>
            `,
                    },
                    PublicPagesDirectory: {
                        template: '<div data-test="public-pages-directory" />',
                    },
                },
            },
        })

        expect(wrapper.find('[data-test="admin-layout"]').exists()).toBe(true)
        expect(
            wrapper.find('[data-test="public-pages-directory"]').exists()
        ).toBe(true)
    })
})
