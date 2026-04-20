import { mount } from '@vue/test-utils'
import BaseIcon from './BaseIcon.vue'

describe('BaseIcon', () => {
  it('renders icon svg for known icon name', () => {
    const wrapper = mount(BaseIcon, {
      props: {
        name: 'users',
      },
    })

    expect(wrapper.html()).toContain('<svg')
    expect(wrapper.html()).toContain('lucide-users')
  })

  it('renders empty icon content for unknown icon name', () => {
    const wrapper = mount(BaseIcon, {
      props: {
        name: 'does-not-exist',
      },
    })

    expect(wrapper.html()).not.toContain('<svg')
  })

  it('uses active color class when active', () => {
    const wrapper = mount(BaseIcon, {
      props: {
        name: 'users',
        active: true,
      },
    })

    expect(wrapper.get('span').classes()).toContain('text-ext-wf3')
  })
})
