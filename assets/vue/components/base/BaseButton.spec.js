import { mount } from '@vue/test-utils'
import BaseButton from './BaseButton.vue'

describe('BaseButton', () => {
  it('renders slot content', () => {
    const wrapper = mount(BaseButton, {
      slots: {
        default: 'Save',
      },
    })

    expect(wrapper.text()).toContain('Save')
  })

  it('uses primary styles by default', () => {
    const wrapper = mount(BaseButton)
    const classes = wrapper.get('button').classes()

    expect(classes).toContain('text-white')
    expect(classes).toContain('bg-blue-600')
  })

  it('uses secondary styles when variant is secondary', () => {
    const wrapper = mount(BaseButton, {
      props: {
        variant: 'secondary',
      },
    })

    const classes = wrapper.get('button').classes()
    expect(classes).toContain('text-gray-700')
    expect(classes).toContain('bg-white')
  })

  it('forwards attributes to button', () => {
    const wrapper = mount(BaseButton, {
      attrs: {
        disabled: true,
        'data-testid': 'submit-button',
      },
    })

    const button = wrapper.get('button')
    expect(button.attributes('disabled')).toBeDefined()
    expect(button.attributes('data-testid')).toBe('submit-button')
  })
})
