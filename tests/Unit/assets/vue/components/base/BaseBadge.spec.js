import { mount } from '@vue/test-utils'
import BaseBadge from '../../../../../../assets/vue/components/base/BaseBadge.vue'

describe('BaseBadge', () => {
  it('applies shared base badge classes', () => {
    const wrapper = mount(BaseBadge)
    const classes = wrapper.get('span').classes()

    expect(classes).toContain('inline-flex')
    expect(classes).toContain('items-center')
    expect(classes).toContain('px-2')
    expect(classes).toContain('py-0.5')
    expect(classes).toContain('rounded-full')
    expect(classes).toContain('text-xs')
    expect(classes).toContain('font-medium')
  })

  it('renders neutral variant by default', () => {
    const wrapper = mount(BaseBadge, {
      slots: {
        default: 'All',
      },
    })

    const classes = wrapper.get('span').classes()
    expect(wrapper.text()).toContain('All')
    expect(classes).toContain('bg-gray-100')
    expect(classes).toContain('text-gray-800')
  })

  it('renders counter variant styles', () => {
    const wrapper = mount(BaseBadge, {
      props: {
        variant: 'counter',
      },
      slots: {
        default: '10',
      },
    })

    const classes = wrapper.get('span').classes()
    expect(classes).toContain('bg-indigo-50')
    expect(classes).toContain('text-ext-wf3')
    expect(classes).toContain('border')
    expect(classes).toContain('border-indigo-100')
    expect(wrapper.text()).toContain('10')
  })

  it('falls back to neutral styles for unknown variant', () => {
    const wrapper = mount(BaseBadge, {
      props: {
        variant: 'unexpected',
      },
    })

    const classes = wrapper.get('span').classes()
    expect(classes).toContain('bg-gray-100')
    expect(classes).toContain('text-gray-800')
  })

  it('forwards attributes to the root span', () => {
    const wrapper = mount(BaseBadge, {
      attrs: {
        'data-testid': 'badge',
      },
    })

    expect(wrapper.get('span').attributes('data-testid')).toBe('badge')
  })
})
