import { flushPromises, mount } from '@vue/test-utils'
import { Requests } from '@tatevikgr/rest-api-client'
import PublicPagesDirectory from '../../../../../../assets/vue/components/public-pages/PublicPagesDirectory.vue'

const {
  pushMock,
  subscribePagesClientMock,
} = vi.hoisted(() => ({
  pushMock: vi.fn(() => Promise.resolve()),
  subscribePagesClientMock: {
    getSubscribePages: vi.fn(),
    deleteSubscribePage: vi.fn(),
    updateSubscribePage: vi.fn(),
  },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock('../../../../../../assets/vue/api', () => ({
  subscribePagesClient: subscribePagesClientMock,
}))

vi.mock('@tatevikgr/rest-api-client', () => ({
  Requests: {
    UpdateSubscribePageRequest: vi.fn((title, active) => ({ title, active })),
  },
}))

const mountComponent = () => mount(PublicPagesDirectory, {
  global: {
    stubs: {
      BaseIcon: true,
    },
  },
})

describe('PublicPagesDirectory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    subscribePagesClientMock.getSubscribePages.mockResolvedValue({
      items: [],
      pagination: {
        hasMore: false,
      },
    })
  })

  it('loads and renders subscribe pages on mount', async () => {
    subscribePagesClientMock.getSubscribePages.mockResolvedValueOnce({
      items: [{
        id: 2,
        title: 'Main page',
        owner: { loginName: 'owner-admin' },
        isDefault: false,
        active: true,
      }],
      pagination: {
        hasMore: false,
      },
    })

    const wrapper = mountComponent()
    await flushPromises()

    expect(subscribePagesClientMock.getSubscribePages).toHaveBeenCalledWith(null, 100)
    expect(wrapper.text()).toContain('Main page')
    expect(wrapper.text()).toContain('owner-admin')
  })

  it('navigates to create page when add button is clicked', async () => {
    const wrapper = mountComponent()
    await flushPromises()

    const createButton = wrapper.findAll('button').find((button) => button.text().includes('Add New Subscribe Page'))
    await createButton.trigger('click')

    expect(pushMock).toHaveBeenCalledWith({ name: 'public-page-create' })
  })

  it('updates active state when active checkbox changes', async () => {
    subscribePagesClientMock.getSubscribePages.mockResolvedValueOnce({
      items: [{
        id: 5,
        title: 'Weekly updates',
        owner: { loginName: 'editor' },
        isDefault: false,
        active: false,
      }],
      pagination: {
        hasMore: false,
      },
    })

    const wrapper = mountComponent()
    await flushPromises()

    const activeCheckbox = wrapper.find('input[type="checkbox"]')
    await activeCheckbox.setValue(true)
    await flushPromises()

    expect(Requests.UpdateSubscribePageRequest).toHaveBeenCalledWith('Weekly updates', true)
    expect(subscribePagesClientMock.updateSubscribePage).toHaveBeenCalledWith(5, {
      title: 'Weekly updates',
      active: true,
    })
  })

  it('does not delete when confirmation is cancelled', async () => {
    subscribePagesClientMock.getSubscribePages.mockResolvedValueOnce({
      items: [{
        id: 9,
        title: 'To delete',
        owner: { loginName: 'manager' },
        isDefault: false,
        active: true,
      }],
      pagination: {
        hasMore: false,
      },
    })
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    const wrapper = mountComponent()
    await flushPromises()

    const deleteButton = wrapper.findAll('button').find((button) => button.text().includes('Delete'))
    await deleteButton.trigger('click')

    expect(subscribePagesClientMock.deleteSubscribePage).not.toHaveBeenCalled()
  })
})
