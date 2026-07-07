import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ListView from '../../../../../assets/vue/views/ListsView.vue'

describe('ListView', () => {
    it('renders the AdminLayout and ListDirectory components', () => {
        const wrapper = mount(ListView, {
            global: {
                stubs: {
                    AdminLayout: {
                        template: `
              <div data-test="admin-layout">
                <slot />
              </div>
            `,
                    },
                    ListDirectory: {
                        template: '<div data-test="list-directory" />',
                    },
                },
            },
        })

        expect(wrapper.find('[data-test="admin-layout"]').exists()).toBe(true)
        expect(wrapper.find('[data-test="list-directory"]').exists()).toBe(true)
    })
})
