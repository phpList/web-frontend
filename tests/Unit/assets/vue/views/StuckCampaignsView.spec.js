import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StuckCampaignsView from '../../../../../assets/vue/views/StuckCampaignsView.vue'

const AdminLayoutStub = {
  template: `
    <div data-test="admin-layout">
      <slot />
    </div>
  `,
}

const StuckCampaignsListStub = {
  template: '<div data-test="stuck-campaigns-list" />',
}

describe('StuckCampaignsView', () => {
  it('renders the admin layout', () => {
    const wrapper = mount(StuckCampaignsView, {
      global: {
        stubs: {
          AdminLayout: AdminLayoutStub,
          StuckCampaignsList: StuckCampaignsListStub,
        },
      },
    })

    expect(wrapper.find('[data-test="admin-layout"]').exists()).toBe(true)
  })

  it('renders the stuck campaigns list inside the layout', () => {
    const wrapper = mount(StuckCampaignsView, {
      global: {
        stubs: {
          AdminLayout: AdminLayoutStub,
          StuckCampaignsList: StuckCampaignsListStub,
        },
      },
    })

    const layout = wrapper.find('[data-test="admin-layout"]')

    expect(layout.exists()).toBe(true)
    expect(layout.find('[data-test="stuck-campaigns-list"]').exists()).toBe(true)
  })
})