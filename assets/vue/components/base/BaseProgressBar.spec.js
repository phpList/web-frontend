import { mount } from '@vue/test-utils'
import BaseProgressBar from './BaseProgressBar.vue'

describe('BaseProgressBar', () => {
  it('applies default height and progress attributes', () => {
    const wrapper = mount(BaseProgressBar, {
      props: {
        value: 35,
      },
    })

    const wrapperStyle = wrapper.get('.progress').attributes('style')
    const bar = wrapper.get('[role="progressbar"]')

    expect(wrapperStyle).toContain('height: 6px;')
    expect(bar.attributes('style')).toContain('width: 35%;')
    expect(bar.attributes('aria-valuenow')).toBe('35')
    expect(bar.attributes('aria-valuemin')).toBe('0')
    expect(bar.attributes('aria-valuemax')).toBe('100')
  })

  it('uses custom height when provided', () => {
    const wrapper = mount(BaseProgressBar, {
      props: {
        value: 80,
        height: '10px',
      },
    })

    expect(wrapper.get('.progress').attributes('style')).toContain('height: 10px;')
  })
})
