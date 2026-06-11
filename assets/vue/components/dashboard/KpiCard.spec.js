import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import KpiCard from './KpiCard.vue'

// Stub child components to isolate KpiCard logic
vi.mock('@/components/base/BaseCard.vue', () => ({
    default: { template: '<div><slot /></div>', name: 'BaseCard' },
}))

vi.mock('@/components/base/BaseIcon.vue', () => ({
    default: { template: '<span />', name: 'BaseIcon', props: ['name'] },
}))

const defaultProps = {
    label: 'Total Revenue',
    value: '$48,200',
    change: '+12.5%',
    trend: 'up',
    icon: 'currency-dollar',
}

function mountCard(props = {}) {
    return mount(KpiCard, { props: { ...defaultProps, ...props } })
}

describe('KpiCard', () => {
    describe('rendering', () => {
        it('renders the label', () => {
            const wrapper = mountCard()
            expect(wrapper.text()).toContain('Total Revenue')
        })

        it('renders a string value', () => {
            const wrapper = mountCard({ value: '$48,200' })
            expect(wrapper.text()).toContain('$48,200')
        })

        it('renders a numeric value', () => {
            const wrapper = mountCard({ value: 1024 })
            expect(wrapper.text()).toContain('1024')
        })

        it('renders the change string', () => {
            const wrapper = mountCard({ change: '+12.5%' })
            expect(wrapper.text()).toContain('+12.5%')
        })

        it('renders "vs last month" alongside the change', () => {
            const wrapper = mountCard()
            expect(wrapper.text()).toContain('vs last month')
        })

        it('passes the icon name to BaseIcon', () => {
            const wrapper = mountCard({ icon: 'users' })
            const icon = wrapper.findComponent({ name: 'BaseIcon' })
            expect(icon.props('name')).toBe('users')
        })
    })

    describe('trendClass', () => {
        it('applies text-green-600 when trend is "up"', () => {
            const wrapper = mountCard({ trend: 'up' })
            const changeEl = wrapper.find('p.text-sm')
            expect(changeEl.classes()).toContain('text-green-600')
            expect(changeEl.classes()).not.toContain('text-red-600')
        })

        it('applies text-red-600 when trend is "down"', () => {
            const wrapper = mountCard({ trend: 'down' })
            const changeEl = wrapper.find('p.text-sm')
            expect(changeEl.classes()).toContain('text-red-600')
            expect(changeEl.classes()).not.toContain('text-green-600')
        })

        it('defaults to text-green-600 when trend prop is omitted', () => {
            const wrapper = mount(KpiCard, {
                props: { label: 'X', value: '0', change: '0%', icon: 'chart' },
            })
            const changeEl = wrapper.find('p.text-sm')
            expect(changeEl.classes()).toContain('text-green-600')
        })
    })

    describe('label styling', () => {
        it('renders the label in uppercase via CSS classes', () => {
            const wrapper = mountCard()
            const labelEl = wrapper.find('p.uppercase')
            expect(labelEl.exists()).toBe(true)
            expect(labelEl.text()).toBe('Total Revenue')
        })
    })

    describe('icon container', () => {
        it('renders a rounded icon container', () => {
            const wrapper = mountCard()
            const container = wrapper.find('div.rounded-full')
            expect(container.exists()).toBe(true)
        })
    })

    describe('prop types', () => {
        it('accepts a number for value without throwing', () => {
            expect(() => mountCard({ value: 9999 })).not.toThrow()
        })

        it('accepts a string for value without throwing', () => {
            expect(() => mountCard({ value: '9,999' })).not.toThrow()
        })
    })
})
