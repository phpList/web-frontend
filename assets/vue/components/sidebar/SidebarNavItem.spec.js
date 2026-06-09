// SidebarNavItem.spec.js

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SidebarNavItem from './SidebarNavItem.vue'

const closeSidebar = vi.fn()

vi.mock('../../composables/useSidebar', () => ({
    useSidebar: () => ({
        closeSidebar,
    }),
}))

vi.mock('vue-router', () => ({
    useRoute: () => ({
        path: '/dashboard',
    }),
}))

const BaseIconStub = {
    name: 'BaseIcon',
    props: ['name', 'active'],
    template: '<span class="base-icon" />',
}

const BaseBadgeStub = {
    name: 'BaseBadge',
    props: ['variant'],
    template: '<span class="base-badge"><slot /></span>',
}

describe('SidebarNavItem', () => {
    const item = {
        label: 'Dashboard',
        icon: 'grid',
        route: '/',
    }

    const createWrapper = ({
                               active = false,
                               itemOverrides = {},
                           } = {}) =>
        mount(SidebarNavItem, {
            props: {
                item: {
                    ...item,
                    ...itemOverrides,
                },
            },
            global: {
                stubs: {
                    BaseIcon: BaseIconStub,
                    BaseBadge: BaseBadgeStub,
                    RouterLink: {
                        name: 'RouterLink',
                        props: ['to', 'custom'],
                        template: `
              <slot
                :navigate="navigate"
                :href="to"
                :isActive="${active}"
              />
            `,
                        methods: {
                            navigate: vi.fn(),
                        },
                    },
                },
            },
        })

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders item label', () => {
        const wrapper = createWrapper()

        expect(wrapper.text()).toContain('Dashboard')
    })

    it('renders item route as href', () => {
        const wrapper = createWrapper()

        expect(
            wrapper.find('a').attributes('href')
        ).toBe('/')
    })

    it('passes icon name to BaseIcon', () => {
        const wrapper = createWrapper()

        const icon = wrapper.findComponent(BaseIconStub)

        expect(icon.props('name')).toBe('grid')
    })

    it('passes active state to BaseIcon', () => {
        const wrapper = createWrapper({
            active: true,
        })

        const icon = wrapper.findComponent(BaseIconStub)

        expect(icon.props('active')).toBe(true)
    })

    it('applies active styling when active', () => {
        const wrapper = createWrapper({
            active: true,
        })

        expect(wrapper.find('a').classes())
            .toContain('bg-indigo-50')

        expect(wrapper.find('a').classes())
            .toContain('text-ext-wf3')
    })

    it('applies inactive styling when inactive', () => {
        const wrapper = createWrapper({
            active: false,
        })

        expect(wrapper.find('a').classes())
            .toContain('text-slate-600')

        expect(wrapper.find('a').classes())
            .toContain('hover:bg-slate-50')
    })

    it('renders badge when present', () => {
        const wrapper = createWrapper({
            itemOverrides: {
                badge: 12,
            },
        })

        const badge =
            wrapper.findComponent(BaseBadgeStub)

        expect(badge.exists()).toBe(true)
        expect(badge.props('variant'))
            .toBe('counter')

        expect(badge.text()).toBe('12')
    })

    it('does not render badge when badge is null', () => {
        const wrapper = createWrapper()

        expect(
            wrapper.findComponent(BaseBadgeStub).exists()
        ).toBe(false)
    })

    it('does not render badge when badge is undefined', () => {
        const wrapper = createWrapper({
            itemOverrides: {
                badge: undefined,
            },
        })

        expect(
            wrapper.findComponent(BaseBadgeStub).exists()
        ).toBe(false)
    })

    it('calls closeSidebar when clicked', async () => {
        const wrapper = createWrapper()

        await wrapper.find('a').trigger('click')

        expect(closeSidebar)
            .toHaveBeenCalledTimes(1)
    })

    it('renders RouterLink with item route', () => {
        const wrapper = createWrapper()

        const routerLink =
            wrapper.findComponent({ name: 'RouterLink' })

        expect(routerLink.props('to'))
            .toBe('/')
    })
})
