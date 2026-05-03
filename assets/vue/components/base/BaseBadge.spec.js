import { mount } from '@vue/test-utils'
import BaseBadge from './BaseBadge.vue'

describe('BaseBadge', () => {
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
    expect(wrapper.text()).toContain('10')
  })
})
