// SidebarNavSection.spec.js

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SidebarNavSection from './SidebarNavSection.vue'

const SidebarNavItemStub = {
    name: 'SidebarNavItem',
    props: ['item'],
    template: '<div class="sidebar-nav-item">{{ item.label }}</div>',
}

describe('SidebarNavSection', () => {
    const items = [
        {
            label: 'Dashboard',
            icon: 'grid',
            route: '/',
        },
        {
            label: 'Subscribers',
            icon: 'users',
            route: '/subscribers',
        },
    ]

    const createWrapper = (props = {}) =>
        mount(SidebarNavSection, {
            props: {
                label: 'General',
                items,
                ...props,
            },
            global: {
                stubs: {
                    SidebarNavItem: SidebarNavItemStub,
                },
            },
        })

    it('renders section label', () => {
        const wrapper = createWrapper()

        expect(wrapper.text()).toContain('General')
    })

    it('renders a nav item for each item', () => {
        const wrapper = createWrapper()

        const navItems = wrapper.findAllComponents(
            SidebarNavItemStub
        )

        expect(navItems).toHaveLength(2)
    })

    it('passes item props to SidebarNavItem', () => {
        const wrapper = createWrapper()

        const navItems = wrapper.findAllComponents(
            SidebarNavItemStub
        )

        expect(navItems[0].props('item'))
            .toEqual(items[0])

        expect(navItems[1].props('item'))
            .toEqual(items[1])
    })

    it('renders item labels through SidebarNavItem', () => {
        const wrapper = createWrapper()

        expect(wrapper.text()).toContain('Dashboard')
        expect(wrapper.text()).toContain('Subscribers')
    })

    it('renders no nav items when items is empty', () => {
        const wrapper = createWrapper({
            items: [],
        })

        expect(
            wrapper.findAllComponents(SidebarNavItemStub)
        ).toHaveLength(0)
    })

    it('renders label even when items is empty', () => {
        const wrapper = createWrapper({
            items: [],
        })

        expect(wrapper.text()).toContain('General')
    })
})
