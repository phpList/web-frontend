import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import BouncesView from '../../../../../assets/vue/views/BouncesView.vue'

vi.mock('../../../../../assets/vue/layouts/AdminLayout.vue', () => ({
    default: defineComponent({
        name: 'AdminLayout',
        template: '<div><slot /></div>',
    }),
}))

vi.mock('../../../../../assets/vue/components/bounces/BouncesActionsPanel.vue', () => ({
    default: defineComponent({
        name: 'BouncesActionsPanel',
        template: '<div>Bounces Actions Panel</div>',
    }),
}))

const mountComponent = () => mount(BouncesView)

describe('BouncesView', () => {
    it('renders the admin layout', () => {
        const wrapper = mountComponent()

        expect(wrapper.findComponent({ name: 'AdminLayout' }).exists()).toBe(true)
    })

    it('renders the bounces actions panel inside the layout', () => {
        const wrapper = mountComponent()

        expect(wrapper.findComponent({ name: 'BouncesActionsPanel' }).exists()).toBe(true)
        expect(wrapper.text()).toContain('Bounces Actions Panel')
    })
})
