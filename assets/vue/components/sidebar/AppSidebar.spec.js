// AppSidebar.spec.js

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import AppSidebar from './AppSidebar.vue'

const isSidebarOpen = ref(false)
const closeSidebar = vi.fn()

vi.mock('../../composables/useSidebar', () => ({
    useSidebar: () => ({
        isSidebarOpen,
        closeSidebar,
    }),
}))

const SidebarLogoStub = {
    name: 'SidebarLogo',
    template: '<div class="sidebar-logo" />',
}

const BaseIconStub = {
    name: 'BaseIcon',
    template: '<span class="base-icon" />',
}

const SidebarNavSectionStub = {
    name: 'SidebarNavSection',
    props: ['id', 'label', 'items'],
    template: '<div class="sidebar-section">{{ label }}</div>',
}

describe('AppSidebar', () => {
    const createWrapper = () =>
        mount(AppSidebar, {
            global: {
                stubs: {
                    SidebarLogo: SidebarLogoStub,
                    BaseIcon: BaseIconStub,
                    SidebarNavSection: SidebarNavSectionStub,
                },
            },
        })

    beforeEach(() => {
        vi.clearAllMocks()
        isSidebarOpen.value = false
    })

    it('renders logo', () => {
        const wrapper = createWrapper()

        expect(
            wrapper.findComponent(SidebarLogoStub).exists()
        ).toBe(true)
    })

    it('renders all navigation sections', () => {
        const wrapper = createWrapper()

        const sections = wrapper.findAllComponents(
            SidebarNavSectionStub
        )

        expect(sections).toHaveLength(4)

        expect(sections.map(s => s.props('label')))
            .toEqual([
                'General',
                'Marketing',
                'Reports',
                'System',
            ])
    })

    it('passes items to navigation sections', () => {
        const wrapper = createWrapper()

        const generalSection =
            wrapper.findAllComponents(
                SidebarNavSectionStub
            )[0]

        expect(generalSection.props('items'))
            .toHaveLength(3)

        expect(generalSection.props('items')[0])
            .toEqual({
                label: 'Dashboard',
                icon: 'grid',
                route: '/',
                badge: null,
            })
    })

    it('hides backdrop when sidebar is closed', () => {
        const wrapper = createWrapper()

        expect(
            wrapper.find('.backdrop-blur-sm').exists()
        ).toBe(false)
    })

    it('shows backdrop when sidebar is open', () => {
        isSidebarOpen.value = true

        const wrapper = createWrapper()

        expect(
            wrapper.find('.backdrop-blur-sm').exists()
        ).toBe(true)
    })

    it('shows hidden class when sidebar is closed', () => {
        const wrapper = createWrapper()

        const aside = wrapper.find('aside')

        expect(aside.classes())
            .toContain('-translate-x-full')
    })

    it('shows visible class when sidebar is open', () => {
        isSidebarOpen.value = true

        const wrapper = createWrapper()

        const aside = wrapper.find('aside')

        expect(aside.classes())
            .toContain('translate-x-0')
    })

    it('closes sidebar when backdrop is clicked', async () => {
        isSidebarOpen.value = true

        const wrapper = createWrapper()

        await wrapper
            .find('.backdrop-blur-sm')
            .trigger('click')

        expect(closeSidebar)
            .toHaveBeenCalledTimes(1)
    })

    it('closes sidebar when close button is clicked', async () => {
        const wrapper = createWrapper()

        const buttons = wrapper.findAll('button')

        await buttons[0].trigger('click')

        expect(closeSidebar)
            .toHaveBeenCalledTimes(1)
    })

    it('reacts when sidebar state changes', async () => {
        const wrapper = createWrapper()

        expect(
            wrapper.find('aside').classes()
        ).toContain('-translate-x-full')

        isSidebarOpen.value = true

        await wrapper.vm.$nextTick()

        expect(
            wrapper.find('aside').classes()
        ).toContain('translate-x-0')
    })
})
