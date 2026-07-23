// SidebarLogo.spec.js

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SidebarLogo from '../../../../../../assets/vue/components/sidebar/SidebarLogo.vue'

vi.mock('../../../../../../assets/images/logo-48.png', () => ({
    default: '/mock-logo.png',
}))

describe('SidebarLogo', () => {
    const createWrapper = () =>
        mount(SidebarLogo, {
            global: {
                stubs: {
                    RouterLink: {
                        name: 'RouterLink',
                        props: ['to'],
                        template: `
              <a :href="to">
                <slot />
              </a>
            `,
                    },
                },
            },
        })

    it('renders a link to the dashboard', () => {
        const wrapper = createWrapper()

        const link = wrapper.find('a')

        expect(link.attributes('href')).toBe('/')
    })

    it('renders the logo image', () => {
        const wrapper = createWrapper()

        const image = wrapper.find('img')

        expect(image.exists()).toBe(true)
        expect(image.attributes('src')).toBe('/mock-logo.png')
    })

    it('renders the correct alt text', () => {
        const wrapper = createWrapper()

        expect(
            wrapper.find('img').attributes('alt')
        ).toBe('Logo')
    })

    it('renders the application name', () => {
        const wrapper = createWrapper()

        expect(wrapper.text()).toContain('phpList')
        expect(wrapper.text()).toContain('4')
    })

    it('renders a RouterLink component', () => {
        const wrapper = createWrapper()

        const routerLink = wrapper.findComponent({
            name: 'RouterLink',
        })

        expect(routerLink.exists()).toBe(true)
        expect(routerLink.props('to')).toBe('/')
    })

    it('renders image inside the logo container', () => {
        const wrapper = createWrapper()

        const image = wrapper.find('img')

        expect(image.classes()).toContain('w-full')
        expect(image.classes()).toContain('block')
    })
})
