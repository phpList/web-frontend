// tests/views/CampaignsView.spec.js

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CampaignsView from '../../../../../assets/vue/views/CampaignsView.vue'

const AdminLayoutStub = {
  template: `
    <div data-test="admin-layout">
      <slot />
    </div>
  `,
}

const CampaignDirectoryStub = {
  template: '<div data-test="campaign-directory" />',
}

describe('CampaignsView', () => {
  it('renders the admin layout', () => {
    const wrapper = mount(CampaignsView, {
      global: {
        stubs: {
          AdminLayout: AdminLayoutStub,
          CampaignDirectory: CampaignDirectoryStub,
        },
      },
    })

    expect(wrapper.find('[data-test="admin-layout"]').exists()).toBe(true)
  })

  it('renders the campaign directory inside the layout', () => {
    const wrapper = mount(CampaignsView, {
      global: {
        stubs: {
          AdminLayout: AdminLayoutStub,
          CampaignDirectory: CampaignDirectoryStub,
        },
      },
    })

    const layout = wrapper.find('[data-test="admin-layout"]')

    expect(layout.exists()).toBe(true)
    expect(layout.find('[data-test="campaign-directory"]').exists()).toBe(true)
  })
})
