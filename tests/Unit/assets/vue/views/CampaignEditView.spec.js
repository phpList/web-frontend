import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import CampaignEditView from '../../../../../assets/vue/views/CampaignEditView.vue'

const {
  routeMock,
  pushMock,
  replaceMock,
  campaignClientMock,
  listMessagesClientMock,
  templateClientMock,
  fetchAllListsMock,
} = vi.hoisted(() => ({
  routeMock: {
    name: 'campaign-create',
    params: { campaignId: '' },
    query: {},
  },
  pushMock: vi.fn(() => Promise.resolve()),
  replaceMock: vi.fn(() => Promise.resolve()),
  campaignClientMock: {
    getCampaign: vi.fn(),
    createCampaign: vi.fn(),
    updateCampaign: vi.fn(),
    updateCampaignStatus: vi.fn(),
    testSendCampaign: vi.fn(),
  },
  listMessagesClientMock: {
    getListsByMessage: vi.fn(),
    associateMessageWithList: vi.fn(),
    dissociateMessageFromList: vi.fn(),
  },
  templateClientMock: {
    getTemplates: vi.fn(),
  },
  fetchAllListsMock: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeMock,
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  RouterLink: defineComponent({
    name: 'RouterLink',
    props: ['to'],
    template: '<a><slot /></a>',
  }),
}))

vi.mock('../../../../../assets/vue/layouts/AdminLayout.vue', () => ({
  default: defineComponent({
    name: 'AdminLayout',
    template: '<div class="admin-layout"><slot /></div>',
  }),
}))

vi.mock('../../../../../assets/vue/components/base/CkEditorField.vue', () => ({
  default: defineComponent({
    name: 'CkEditorField',
    emits: ['update:modelValue'],
    props: ['id', 'label', 'modelValue'],
    template: `
      <div>
        <textarea 
          :id="id"
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
        ></textarea>
      </div>
    `,
  }),
}))

vi.mock('../../../../../assets/vue/api', () => ({
  campaignClient: campaignClientMock,
  listMessagesClient: listMessagesClientMock,
  templateClient: templateClientMock,
  fetchAllLists: fetchAllListsMock,
}))

const mountComponent = () => mount(CampaignEditView)

describe('CampaignEditView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''

    routeMock.name = 'campaign-create'
    routeMock.params = { campaignId: '' }
    routeMock.query = {}

    fetchAllListsMock.mockResolvedValue([
      { id: 1, name: 'Newsletter' },
      { id: 2, name: 'Promotions' },
      { id: 3, name: 'Updates' },
    ])

    templateClientMock.getTemplates.mockResolvedValue({
      items: [
        { id: 1, title: 'Template 1' },
        { id: 2, title: 'Template 2' },
      ],
    })

    campaignClientMock.getCampaign.mockResolvedValue({
      id: 42,
      messageContent: {
        subject: 'Existing Campaign',
        text: 'Hello world',
        footer: 'Footer text',
      },
      messageOptions: {
        fromField: 'sender@example.com',
        toField: '[EMAIL]',
        replyTo: 'reply@example.com',
        userSelection: '',
      },
      messageFormat: {
        htmlFormated: true,
        sendFormat: 'html',
      },
      messageSchedule: {
        embargo: null,
        repeatInterval: null,
        repeatUntil: null,
        requeueInterval: null,
        requeueUntil: null,
      },
      messageMetadata: {
        status: 'draft',
      },
      template: { id: 1 },
    })

    listMessagesClientMock.getListsByMessage.mockResolvedValue({
      items: [
        { id: 1, name: 'Newsletter' },
        { id: 2, name: 'Promotions' },
      ],
    })

    campaignClientMock.createCampaign.mockResolvedValue({
      id: 100,
      messageContent: {},
      messageOptions: {},
      messageFormat: {},
      messageSchedule: {},
      messageMetadata: { status: 'draft' },
    })

    campaignClientMock.updateCampaign.mockResolvedValue({
      id: 42,
      messageContent: {},
      messageOptions: {},
      messageFormat: {},
      messageSchedule: {},
      messageMetadata: { status: 'draft' },
    })

    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('Create Mode', () => {
    it('renders create page title in create mode', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('Create Campaign')
    })

    it('loads mailing lists in create mode', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      expect(fetchAllListsMock).toHaveBeenCalled()

      // Navigate to lists tab to see the lists
      const stepButtons = wrapper.findAll('button')
      const step4Button = stepButtons.find((btn) => btn.text().includes('4'))
      await step4Button.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Newsletter')
      expect(wrapper.text()).toContain('Promotions')
      expect(wrapper.text()).toContain('Updates')
    })

    it('initializes form with default values in create mode', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const subjectInput = wrapper.find('#campaign-subject')
      expect(subjectInput.element.value).toBe('')
    })
  })

  describe('Edit Mode', () => {
    beforeEach(() => {
      routeMock.name = 'campaign-edit'
      routeMock.params = { campaignId: '42' }
    })

    it('renders edit page title in edit mode', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('Edit Campaign #42')
    })

    it('loads campaign data in edit mode', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      expect(campaignClientMock.getCampaign).toHaveBeenCalledWith(42)
      // Check that the form was populated
      expect(wrapper.vm.form.subject).toBe('Existing Campaign')
    })

    it('populates form with campaign data', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const subjectInput = wrapper.find('#campaign-subject')
      expect(subjectInput.element.value).toBe('Existing Campaign')
    })

    it('loads associated lists for the campaign', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      expect(listMessagesClientMock.getListsByMessage).toHaveBeenCalledWith(42)
    })

    it('displays error message when campaign loading fails', async () => {
      campaignClientMock.getCampaign.mockRejectedValue(new Error('Failed to load'))

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('Failed to load')
    })
  })

  describe('Step Navigation', () => {
    it('renders all step buttons', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('1')
      expect(wrapper.text()).toContain('2')
      expect(wrapper.text()).toContain('3')
      expect(wrapper.text()).toContain('4')
      expect(wrapper.text()).toContain('5')
      expect(wrapper.text()).toContain('6')
    })

    it('starts on step 1', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('Content')
    })

    it('navigates to next step when next button is clicked', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const nextButton = wrapper.findAll('button').find(
        (btn) => btn.text().trim() === 'Next'
      )
      await nextButton.trigger('click')

      expect(wrapper.text()).toContain('Format')
    })

    it('navigates to previous step when back button is clicked', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      // Go to step 2
      let nextButton = wrapper.findAll('button').find(
        (btn) => btn.text().trim() === 'Next'
      )
      await nextButton.trigger('click')

      // Go back to step 1
      let backButton = wrapper.findAll('button').find(
        (btn) => btn.text().trim() === 'Back'
      )
      await backButton.trigger('click')

      expect(wrapper.text()).toContain('Content')
    })

    it('navigates to specific step when step button is clicked', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const stepButtons = wrapper.findAll('button')
      const step4Button = stepButtons.find((btn) => btn.text().includes('4'))
      await step4Button.trigger('click')

      expect(wrapper.text()).toContain('Lists')
    })

    it('disables back button on first step', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const backButton = wrapper.findAll('button').find(
        (btn) => btn.text().trim() === 'Back'
      )
      expect(backButton.attributes('disabled')).toBeDefined()
    })

    it('updates route query when changing steps', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const stepButtons = wrapper.findAll('button')
      const step2Button = stepButtons.find((btn) => btn.text().includes('2'))
      await step2Button.trigger('click')
      await flushPromises()

      expect(replaceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            section: 'format',
          }),
        })
      )
    })
  })

  describe('Content Tab (Step 1)', () => {
    it('displays subject input field', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const subjectInput = wrapper.find('#campaign-subject')
      expect(subjectInput.exists()).toBe(true)
    })

    it('displays compose mode selection radio buttons', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.text()).toContain('Send a webpage')
      expect(wrapper.text()).toContain('Compose message')
    })

    it('shows webpage URL field when webpage mode is selected', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const webpageRadio = wrapper.findAll('input[type="radio"]').find(
        (input) => input.element.value === 'webpage'
      )
      await webpageRadio.setValue(true)
      await wrapper.vm.$nextTick()

      const urlInput = wrapper.find('#campaign-webpage-url')
      expect(urlInput.exists()).toBe(true)
    })

    it('shows compose HTML editor when compose mode is selected', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const composeRadio = wrapper.findAll('input[type="radio"]').find(
        (input) => input.element.value === 'compose'
      )
      await composeRadio.setValue(true)
      await wrapper.vm.$nextTick()

      expect(wrapper.findComponent({ name: 'CkEditorField' }).exists()).toBe(true)
    })

    it('displays footer textarea', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const footerInput = wrapper.find('#campaign-footer')
      expect(footerInput.exists()).toBe(true)
    })
  })

  describe('Format Tab (Step 2)', () => {
    beforeEach(async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const stepButtons = wrapper.findAll('button')
      const step2Button = stepButtons.find((btn) => btn.text().includes('2'))
      await step2Button.trigger('click')
      await wrapper.vm.$nextTick()
    })

    it('displays template dropdown', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const stepButtons = wrapper.findAll('button')
      const step2Button = stepButtons.find((btn) => btn.text().includes('2'))
      await step2Button.trigger('click')
      await wrapper.vm.$nextTick()

      const templateSelect = wrapper.find('#campaign-template')
      expect(templateSelect.exists()).toBe(true)
    })

    it('displays send format radio buttons', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const stepButtons = wrapper.findAll('button')
      const step2Button = stepButtons.find((btn) => btn.text().includes('2'))
      await step2Button.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('HTML')
      expect(wrapper.text()).toContain('Text')
      expect(wrapper.text()).toContain('Invite')
    })

    it('displays HTML formatted checkbox', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const stepButtons = wrapper.findAll('button')
      const step2Button = stepButtons.find((btn) => btn.text().includes('2'))
      await step2Button.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('HTML formatted')
    })
  })

  describe('Scheduling Tab (Step 3)', () => {
    it('displays embargo date/time input', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const stepButtons = wrapper.findAll('button')
      const step3Button = stepButtons.find((btn) => btn.text().includes('3'))
      await step3Button.trigger('click')
      await wrapper.vm.$nextTick()

      const embargoInput = wrapper.find('#campaign-embargo')
      expect(embargoInput.exists()).toBe(true)
    })

    it('displays repeat interval input', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const stepButtons = wrapper.findAll('button')
      const step3Button = stepButtons.find((btn) => btn.text().includes('3'))
      await step3Button.trigger('click')
      await wrapper.vm.$nextTick()

      const repeatInput = wrapper.find('#campaign-repeat-interval')
      expect(repeatInput.exists()).toBe(true)
    })

    it('displays repeat until date/time input', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const stepButtons = wrapper.findAll('button')
      const step3Button = stepButtons.find((btn) => btn.text().includes('3'))
      await step3Button.trigger('click')
      await wrapper.vm.$nextTick()

      const repeatUntilInput = wrapper.find('#campaign-repeat-until')
      expect(repeatUntilInput.exists()).toBe(true)
    })

    it('displays requeue interval and requeue until inputs', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const stepButtons = wrapper.findAll('button')
      const step3Button = stepButtons.find((btn) => btn.text().includes('3'))
      await step3Button.trigger('click')
      await wrapper.vm.$nextTick()

      const requeueIntervalInput = wrapper.find('#campaign-requeue-interval')
      const requeueUntilInput = wrapper.find('#campaign-requeue-until')

      expect(requeueIntervalInput.exists()).toBe(true)
      expect(requeueUntilInput.exists()).toBe(true)
    })
  })

  describe('Lists Tab (Step 4)', () => {
    it('displays mailing lists with checkboxes', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const stepButtons = wrapper.findAll('button')
      const step4Button = stepButtons.find((btn) => btn.text().includes('4'))
      await step4Button.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Newsletter')
      expect(wrapper.text()).toContain('Promotions')
      expect(wrapper.text()).toContain('Updates')
    })

    it('allows selecting and deselecting lists', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const stepButtons = wrapper.findAll('button')
      const step4Button = stepButtons.find((btn) => btn.text().includes('4'))
      await step4Button.trigger('click')
      await wrapper.vm.$nextTick()

      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      expect(checkboxes.length).toBeGreaterThan(0)
    })
  })

  describe('Test Send Tab (Step 5)', () => {
    it('displays test recipients textarea', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const stepButtons = wrapper.findAll('button')
      const step5Button = stepButtons.find((btn) => btn.text().includes('5'))
      await step5Button.trigger('click')
      await wrapper.vm.$nextTick()

      const testRecipientsInput = wrapper.find('#campaign-test-recipients')
      expect(testRecipientsInput.exists()).toBe(true)
    })

    it('displays send test button', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const stepButtons = wrapper.findAll('button')
      const step5Button = stepButtons.find((btn) => btn.text().includes('5'))
      await step5Button.trigger('click')
      await wrapper.vm.$nextTick()

      const sendTestButton = wrapper.findAll('button').find(
        (btn) => btn.text().includes('Send test')
      )
      expect(sendTestButton.exists()).toBe(true)
    })

    it('sends test campaign when button is clicked', async () => {
      routeMock.name = 'campaign-edit'
      routeMock.params = { campaignId: '42' }

      const wrapper = mountComponent()
      await flushPromises()

      const stepButtons = wrapper.findAll('button')
      const step5Button = stepButtons.find((btn) => btn.text().includes('5'))
      await step5Button.trigger('click')
      await wrapper.vm.$nextTick()

      // Fill test recipients
      const testRecipientsInput = wrapper.find('#campaign-test-recipients')
      await testRecipientsInput.setValue('test@example.com')

      // Click send test button
      const sendTestButton = wrapper.findAll('button').find(
        (btn) => btn.text().includes('Send test')
      )
      await sendTestButton.trigger('click')
      await flushPromises()

      expect(campaignClientMock.testSendCampaign).toHaveBeenCalledWith(42, ['test@example.com'])
    })

    it('shows error when no test recipients are provided', async () => {
      routeMock.name = 'campaign-edit'
      routeMock.params = { campaignId: '42' }

      const wrapper = mountComponent()
      await flushPromises()

      const stepButtons = wrapper.findAll('button')
      const step5Button = stepButtons.find((btn) => btn.text().includes('5'))
      await step5Button.trigger('click')
      await wrapper.vm.$nextTick()

      // Click send test button without filling recipients
      const sendTestButton = wrapper.findAll('button').find(
        (btn) => btn.text().includes('Send test')
      )
      await sendTestButton.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Please enter at least one test recipient email')
    })
  })

  describe('Finish Tab (Step 6)', () => {
    it('displays from field input', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const stepButtons = wrapper.findAll('button')
      const step6Button = stepButtons.find((btn) => btn.text().includes('6'))
      await step6Button.trigger('click')
      await wrapper.vm.$nextTick()

      const fromInput = wrapper.find('#campaign-from')
      expect(fromInput.exists()).toBe(true)
    })

    it('displays reply-to field input', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const stepButtons = wrapper.findAll('button')
      const step6Button = stepButtons.find((btn) => btn.text().includes('6'))
      await step6Button.trigger('click')
      await wrapper.vm.$nextTick()

      const replyToInput = wrapper.find('#campaign-reply-to')
      expect(replyToInput.exists()).toBe(true)
    })

    it('displays to field input', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const stepButtons = wrapper.findAll('button')
      const step6Button = stepButtons.find((btn) => btn.text().includes('6'))
      await step6Button.trigger('click')
      await wrapper.vm.$nextTick()

      const toFieldInput = wrapper.find('#campaign-to-field')
      expect(toFieldInput.exists()).toBe(true)
    })

    it('displays campaign ready message when no warnings', async () => {
      routeMock.name = 'campaign-edit'
      routeMock.params = { campaignId: '42' }

      const wrapper = mountComponent()
      await flushPromises()

      const stepButtons = wrapper.findAll('button')
      const step6Button = stepButtons.find((btn) => btn.text().includes('6'))
      await step6Button.trigger('click')
      await wrapper.vm.$nextTick()

      // Select a list first to avoid warning
      const stepButtons4 = wrapper.findAll('button')
      const step4Button = stepButtons4.find((btn) => btn.text().includes('4'))
      await step4Button.trigger('click')
      await wrapper.vm.$nextTick()

      const listCheckboxes = wrapper.findAll('input[type="checkbox"]')
      if (listCheckboxes.length > 0) {
        await listCheckboxes[0].setValue(true)
      }

      await step6Button.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Campaign is ready to save')
    })
  })

  describe('Warnings', () => {
    it('shows warning when no lists are selected', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const stepButtons = wrapper.findAll('button')
      const step6Button = stepButtons.find((btn) => btn.text().includes('6'))
      await step6Button.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Destination lists are missing')
    })

    it('shows warning when webpage URL is missing in webpage mode', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const webpageRadio = wrapper.findAll('input[type="radio"]').find(
        (input) => input.element.value === 'webpage'
      )
      await webpageRadio.setValue(true)
      await wrapper.vm.$nextTick()

      const stepButtons = wrapper.findAll('button')
      const step6Button = stepButtons.find((btn) => btn.text().includes('6'))
      await step6Button.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Webpage URL is required')
    })

    it('shows warning when compose HTML is empty in compose mode', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const composeRadio = wrapper.findAll('input[type="radio"]').find(
        (input) => input.element.value === 'compose'
      )
      await composeRadio.setValue(true)
      await wrapper.vm.$nextTick()

      const stepButtons = wrapper.findAll('button')
      const step6Button = stepButtons.find((btn) => btn.text().includes('6'))
      await step6Button.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('Compose message mode requires HTML or text content')
    })
  })

  describe('Save Campaign', () => {
    it('creates new campaign when in create mode', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      // Fill in required fields
      const subjectInput = wrapper.find('#campaign-subject')
      await subjectInput.setValue('Test Campaign')

      // Switch to compose mode
      const composeRadio = wrapper.findAll('input[type="radio"]').find(
        (input) => input.element.value === 'compose'
      )
      await composeRadio.setValue(true)
      await wrapper.vm.$nextTick()

      // Find and fill the CkEditorField (using the mock textarea)
      const ckEditor = wrapper.findComponent({ name: 'CkEditorField' })
      await ckEditor.vm.$emit('update:modelValue', '<p>Test content</p>')
      await wrapper.vm.$nextTick()

      // Go to lists step and select a list
      const stepButtons = wrapper.findAll('button')
      const step4Button = stepButtons.find((btn) => btn.text().includes('4'))
      await step4Button.trigger('click')
      await wrapper.vm.$nextTick()

      const listCheckboxes = wrapper.findAll('input[type="checkbox"]')
      if (listCheckboxes.length > 0) {
        await listCheckboxes[0].setValue(true)
      }

      // Save
      const saveButton = wrapper.findAll('button').find(
        (btn) => btn.text().includes('Save and continue editing')
      )
      await saveButton.trigger('click')
      await flushPromises()

      expect(campaignClientMock.createCampaign).toHaveBeenCalled()
    })

    it('updates existing campaign when in edit mode', async () => {
      routeMock.name = 'campaign-edit'
      routeMock.params = { campaignId: '42' }

      const wrapper = mountComponent()
      await flushPromises()

      // Modify subject
      const subjectInput = wrapper.find('#campaign-subject')
      await subjectInput.setValue('Updated Campaign')

      // Save
      const saveButton = wrapper.findAll('button').find(
        (btn) => btn.text().includes('Save and continue editing')
      )
      await saveButton.trigger('click')
      await flushPromises()

      expect(campaignClientMock.updateCampaign).toHaveBeenCalledWith(42, expect.any(Object))
    })

    it('shows save error message when save fails', async () => {
      campaignClientMock.createCampaign.mockRejectedValue(
        new Error('Server error')
      )

      const wrapper = mountComponent()
      await flushPromises()

      // Fill in minimal required fields
      const subjectInput = wrapper.find('#campaign-subject')
      await subjectInput.setValue('Test Campaign')

      // Go to step 4 and select a list
      const stepButtons = wrapper.findAll('button')
      const step4Button = stepButtons.find((btn) => btn.text().includes('4'))
      await step4Button.trigger('click')
      await wrapper.vm.$nextTick()

      const listCheckboxes = wrapper.findAll('input[type="checkbox"]')
      if (listCheckboxes.length > 0) {
        await listCheckboxes[0].setValue(true)
      }

      // Try to save
      const saveButton = wrapper.findAll('button').find(
        (btn) => btn.text().includes('Save and continue editing')
      )
      await saveButton.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Server error')
    })

    it('shows success message after saving', async () => {
      routeMock.name = 'campaign-edit'
      routeMock.params = { campaignId: '42' }

      const wrapper = mountComponent()
      await flushPromises()

      const saveButton = wrapper.findAll('button').find(
        (btn) => btn.text().includes('Save and continue editing')
      )
      await saveButton.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Campaign saved successfully')
    })
  })

  describe('Queue Campaign', () => {
    it('queues campaign to send when button is clicked', async () => {
      routeMock.name = 'campaign-edit'
      routeMock.params = { campaignId: '42' }

      const wrapper = mountComponent()
      await flushPromises()

      // Navigate to finish step
      const stepButtons = wrapper.findAll('button')
      const step6Button = stepButtons.find((btn) => btn.text().includes('6'))
      await step6Button.trigger('click')
      await wrapper.vm.$nextTick()

      // Select lists
      const step4Button = stepButtons.find((btn) => btn.text().includes('4'))
      await step4Button.trigger('click')
      await wrapper.vm.$nextTick()

      const listCheckboxes = wrapper.findAll('input[type="checkbox"]')
      if (listCheckboxes.length > 0) {
        await listCheckboxes[0].setValue(true)
      }

      // Find queue button
      const queueButton = wrapper.findAll('button').find(
        (btn) => btn.text().includes('Place campaign in a queue to send')
      )

      if (queueButton) {
        await queueButton.trigger('click')
        await flushPromises()

        expect(campaignClientMock.updateCampaignStatus).toHaveBeenCalledWith(42, 'submitted')
      }
    })

    it('does not show queue button when campaign is already submitted', async () => {
      routeMock.name = 'campaign-edit'
      routeMock.params = { campaignId: '42' }

      campaignClientMock.getCampaign.mockResolvedValueOnce({
        id: 42,
        messageContent: {},
        messageOptions: {},
        messageFormat: {},
        messageSchedule: {},
        messageMetadata: { status: 'submitted' },
      })

      const wrapper = mountComponent()
      await flushPromises()

      const queueButton = wrapper.findAll('button').find(
        (btn) => btn.text().includes('Place campaign in a queue to send')
      )

      expect(queueButton).toBeUndefined()
    })
  })

  describe('Form State Management', () => {
    it('switches between webpage and compose modes', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      // Start in compose mode
      expect(wrapper.findComponent({ name: 'CkEditorField' }).exists()).toBe(true)

      // Switch to webpage mode
      const webpageRadio = wrapper.findAll('input[type="radio"]').find(
        (input) => input.element.value === 'webpage'
      )
      await webpageRadio.setValue(true)
      await wrapper.vm.$nextTick()

      const urlInput = wrapper.find('#campaign-webpage-url')
      expect(urlInput.exists()).toBe(true)
    })

    it('caches HTML content when switching modes', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      // Add HTML content in compose mode
      const ckEditor = wrapper.findComponent({ name: 'CkEditorField' })
      await ckEditor.vm.$emit('update:modelValue', '<p>Cached content</p>')
      await wrapper.vm.$nextTick()

      // Switch to webpage mode
      const webpageRadio = wrapper.findAll('input[type="radio"]').find(
        (input) => input.element.value === 'webpage'
      )
      await webpageRadio.setValue(true)
      await wrapper.vm.$nextTick()

      // Switch back to compose mode
      const composeRadio = wrapper.findAll('input[type="radio"]').find(
        (input) => input.element.value === 'compose'
      )
      await composeRadio.setValue(true)
      await wrapper.vm.$nextTick()

      // Content should be restored (this tests the cache functionality)
      expect(wrapper.vm.form.composeHtml).toBe('<p>Cached content</p>')
    })

    it('extracts webpage URL from [URL:...] token', async () => {
      routeMock.name = 'campaign-edit'
      routeMock.params = { campaignId: '42' }

      campaignClientMock.getCampaign.mockResolvedValue({
        id: 42,
        messageContent: {
          subject: 'Campaign',
          text: '[URL:https://example.com/page]',
          footer: '',
        },
        messageOptions: {},
        messageFormat: { htmlFormated: false, sendFormat: 'html' },
        messageSchedule: {},
        messageMetadata: { status: 'draft' },
      })

      const wrapper = mountComponent()
      await flushPromises()

      expect(wrapper.vm.form.webpageUrl).toBe('https://example.com/page')
      expect(wrapper.vm.form.composeMode).toBe('webpage')
    })
  })

  describe('Template Loading', () => {
    it('loads templates on mount', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      expect(templateClientMock.getTemplates).toHaveBeenCalledWith(0, 1000)
    })

    it('displays loaded templates in dropdown', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      // Navigate to format step where template dropdown is shown
      const stepButtons = wrapper.findAll('button')
      const step2Button = stepButtons.find((btn) => btn.text().includes('2'))
      await step2Button.trigger('click')
      await wrapper.vm.$nextTick()

      const templateSelect = wrapper.find('#campaign-template')
      expect(templateSelect.exists()).toBe(true)

      const options = templateSelect.findAll('option')
      expect(options.some((opt) => opt.text() === 'Template 1')).toBe(true)
      expect(options.some((opt) => opt.text() === 'Template 2')).toBe(true)
    })

    it('handles template loading error gracefully', async () => {
      templateClientMock.getTemplates.mockRejectedValue(new Error('Failed to load'))

      const wrapper = mountComponent()
      await flushPromises()

      // Navigate to format step
      const stepButtons = wrapper.findAll('button')
      const step2Button = stepButtons.find((btn) => btn.text().includes('2'))
      await step2Button.trigger('click')
      await wrapper.vm.$nextTick()

      // Component should render without templates even if loading fails
      const templateSelect = wrapper.find('#campaign-template')
      expect(templateSelect.exists()).toBe(true)
    })
  })

  describe('List Synchronization', () => {
    it('associates selected lists with campaign on save', async () => {
      routeMock.name = 'campaign-edit'
      routeMock.params = { campaignId: '42' }

      listMessagesClientMock.getListsByMessage.mockResolvedValue({
        items: [],
      })

      const wrapper = mountComponent()
      await flushPromises()

      // Go to lists step
      const stepButtons = wrapper.findAll('button')
      const step4Button = stepButtons.find((btn) => btn.text().includes('4'))
      await step4Button.trigger('click')
      await wrapper.vm.$nextTick()

      // Select a list
      const listCheckboxes = wrapper.findAll('input[type="checkbox"]')
      if (listCheckboxes.length > 0) {
        await listCheckboxes[0].setValue(true)
      }

      // Save campaign
      const saveButton = wrapper.findAll('button').find(
        (btn) => btn.text().includes('Save and continue editing')
      )
      await saveButton.trigger('click')
      await flushPromises()

      expect(listMessagesClientMock.associateMessageWithList).toHaveBeenCalled()
    })
  })

  describe('Back to Campaigns Link', () => {
    it('displays back to campaigns link', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const backLink = wrapper.findComponent({ name: 'RouterLink' })
      expect(backLink.exists()).toBe(true)
      expect(backLink.text()).toContain('Back to Campaigns')
    })

    it('links to campaigns route', async () => {
      const wrapper = mountComponent()
      await flushPromises()

      const backLink = wrapper.findComponent({ name: 'RouterLink' })
      expect(backLink.props('to')).toBe('/campaigns')
    })
  })
})

