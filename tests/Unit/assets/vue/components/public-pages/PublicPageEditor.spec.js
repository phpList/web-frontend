import { flushPromises, mount } from '@vue/test-utils'
import PublicPageEditor from '../../../../../../assets/vue/components/public-pages/PublicPageEditor.vue'

const {
  routeMock,
  pushMock,
  replaceMock,
  backendFetchMock,
  fetchAllAdminsMock,
  fetchAllListsMock,
  fetchAllAttributeDefinitionsMock,
  subscribePagesClientMock,
} = vi.hoisted(() => ({
  routeMock: {
    params: {},
    query: {},
  },
  pushMock: vi.fn(() => Promise.resolve()),
  replaceMock: vi.fn(() => Promise.resolve()),
  backendFetchMock: vi.fn(),
  fetchAllAdminsMock: vi.fn(),
  fetchAllListsMock: vi.fn(),
  fetchAllAttributeDefinitionsMock: vi.fn(),
  subscribePagesClientMock: {
    getSubscribePage: vi.fn(),
    createSubscribePage: vi.fn(),
    updateSubscribePage: vi.fn(),
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeMock,
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
}))

vi.mock('../../../../../../assets/vue/api', () => ({
  backendFetch: backendFetchMock,
  fetchAllAdmins: fetchAllAdminsMock,
  fetchAllLists: fetchAllListsMock,
  fetchAllAttributeDefinitions: fetchAllAttributeDefinitionsMock,
  subscribePagesClient: subscribePagesClientMock,
}))

const mountComponent = () => mount(PublicPageEditor)

describe('PublicPageEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    routeMock.params = {}
    routeMock.query = {}

    backendFetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(['english.inc', 'armenian.inc']),
    })
    fetchAllAdminsMock.mockResolvedValue([
      { id: 2, loginName: 'second-admin' },
      { id: 1, loginName: 'first-admin' },
    ])
    fetchAllListsMock.mockResolvedValue([
      { id: 2, name: 'Non-public', public: false },
      { id: 1, name: 'Public list', public: true },
    ])
    fetchAllAttributeDefinitionsMock.mockResolvedValue([
      { id: 2, name: 'City', type: 'text' },
      { id: 1, name: 'Email', type: 'text' },
    ])
    subscribePagesClientMock.getSubscribePage.mockResolvedValue({
      id: 42,
      title: 'Loaded page',
      owner: { id: 4 },
      data: [],
    })
    subscribePagesClientMock.createSubscribePage.mockResolvedValue({ id: 7 })
    subscribePagesClientMock.updateSubscribePage.mockResolvedValue({ id: 42 })
    vi.spyOn(window, 'alert').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders create mode and loads initial dependencies', async () => {
    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.text()).toContain('Create Subscribe Page')
    expect(fetchAllAdminsMock).toHaveBeenCalled()
    expect(fetchAllListsMock).toHaveBeenCalled()
    expect(fetchAllAttributeDefinitionsMock).toHaveBeenCalled()
    expect(subscribePagesClientMock.getSubscribePage).not.toHaveBeenCalled()
  })

  it('renders edit mode and populates title from loaded page data', async () => {
    routeMock.params = { pageId: '42' }
    subscribePagesClientMock.getSubscribePage.mockResolvedValueOnce({
      id: 42,
      title: 'Server page title',
      owner: { id: 11 },
      data: [
        { key: 'title', value: 'Loaded Title' },
        { key: 'language_file', value: 'armenian.inc' },
        { key: 'attributes', value: '' },
      ],
    })

    const wrapper = mountComponent()
    await flushPromises()

    expect(wrapper.text()).toContain('Edit Subscribe Page')
    expect(subscribePagesClientMock.getSubscribePage).toHaveBeenCalledWith(42)
    expect(wrapper.find('input[type="text"]').element.value).toBe('Loaded Title')
  })

  it('updates route query when moving to a different step', async () => {
    const wrapper = mountComponent()
    await flushPromises()

    const listsStepButton = wrapper.findAll('button').find((button) => button.text().includes('Lists'))
    await listsStepButton.trigger('click')
    await flushPromises()

    expect(replaceMock).toHaveBeenCalledWith({
      query: {
        step: '2',
      },
    })
  })

  it('shows validation alert when saving without title', async () => {
    const wrapper = mountComponent()
    await flushPromises()

    const saveButton = wrapper.findAll('button').find((button) => button.text().trim() === 'Save')
    await saveButton.trigger('click')

    expect(window.alert).toHaveBeenCalledWith('Title is required.')
    expect(subscribePagesClientMock.createSubscribePage).not.toHaveBeenCalled()
    expect(subscribePagesClientMock.updateSubscribePage).not.toHaveBeenCalled()
  })
})
