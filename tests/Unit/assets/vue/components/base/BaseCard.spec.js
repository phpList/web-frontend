import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import BaseCard from '../../../../../../assets/vue/components/base/BaseCard.vue'

describe('BaseCard.vue', () => {
    describe('default variant', () => {
        it('renders with default variant when no prop is passed', () => {
            const wrapper = mount(BaseCard)
            expect(wrapper.classes()).toContain('rounded-lg')
            expect(wrapper.classes()).toContain('shadow-sm')
            expect(wrapper.classes()).toContain('border')
            expect(wrapper.classes()).toContain('border-gray-100')
            expect(wrapper.classes()).toContain('bg-white')
        })

        it('renders body with default padding', () => {
            const wrapper = mount(BaseCard)
            const body = wrapper.find('[data-testid="card-body"]')
            expect(body.classes()).toContain('p-4')
        })
    })

    describe('subtle variant', () => {
        it('applies subtle card classes', () => {
            const wrapper = mount(BaseCard, { props: { variant: 'subtle' } })
            expect(wrapper.classes()).toContain('bg-gray-50')
            expect(wrapper.classes()).toContain('border-0')
            expect(wrapper.classes()).not.toContain('bg-white')
        })

        it('applies subtle body classes', () => {
            const wrapper = mount(BaseCard, { props: { variant: 'subtle' } })
            const body = wrapper.find('[data-testid="card-body"]')
            expect(body.classes()).toContain('p-4')
        })
    })

    describe('danger variant', () => {
        it('applies danger card classes', () => {
            const wrapper = mount(BaseCard, { props: { variant: 'danger' } })
            expect(wrapper.classes()).toContain('bg-red-600')
            expect(wrapper.classes()).toContain('text-white')
            expect(wrapper.classes()).toContain('border-0')
        })

        it('applies danger body classes', () => {
            const wrapper = mount(BaseCard, { props: { variant: 'danger' } })
            const body = wrapper.find('[data-testid="card-body"]')
            expect(body.classes()).toContain('p-4')
        })
    })

    describe('success variant', () => {
        it('applies success card classes', () => {
            const wrapper = mount(BaseCard, { props: { variant: 'success' } })
            expect(wrapper.classes()).toContain('bg-green-600')
            expect(wrapper.classes()).toContain('text-white')
            expect(wrapper.classes()).toContain('border-0')
        })

        it('applies success body classes', () => {
            const wrapper = mount(BaseCard, { props: { variant: 'success' } })
            const body = wrapper.find('[data-testid="card-body"]')
            expect(body.classes()).toContain('p-4')
        })
    })

    describe('unknown variant fallback', () => {
        it('falls back to default classes for an unrecognised variant', () => {
            const wrapper = mount(BaseCard, { props: { variant: 'ghost' } })
            expect(wrapper.classes()).toContain('bg-white')
            expect(wrapper.classes()).toContain('border-gray-100')
        })
    })
})
