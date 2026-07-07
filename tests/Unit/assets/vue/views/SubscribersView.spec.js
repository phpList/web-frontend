import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SubscribersView from '../../../../../assets/vue/views/SubscribersView.vue'

describe('SubscribersView', () => {
    it('renders the AdminLayout and SubscriberDirectory components', () => {
        const wrapper = mount(SubscribersView, {
            global: {
                stubs: {
                    AdminLayout: {
                        template: `
              <div data-test="admin-layout">
                <slot />
              </div>
            `,
                    },
                    SubscriberDirectory: {
                        template: '<div data-test="subscriber-directory" />',
                    },
                },
            },
        })

        expect(wrapper.find('[data-test="admin-layout"]').exists()).toBe(true)
        expect(wrapper.find('[data-test="subscriber-directory"]').exists()).toBe(true)
    })
})
