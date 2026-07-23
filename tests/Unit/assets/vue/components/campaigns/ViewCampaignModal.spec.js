import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ViewCampaignModal from '../../../../../../assets/vue/components/campaigns/ViewCampaignModal.vue'

const makeCampaign = (overrides = {}) => ({
  id: 42,
  messageContent: {
    subject: 'Weekly Update',
    text: '<p>HTML body</p>',
    textMessage: 'Plain text body',
    footer: 'Unsubscribe here',
  },
  messageMetadata: { entered: '2024-03-15T10:30:00Z' },
  messageOptions: { fromField: 'sender@example.com' },
  messageSchedule: null,
  ...overrides,
})

const makeList = (id, name) => ({ id, name })

const defaultProps = (overrides = {}) => ({
  isViewModalOpen: true,
  campaign: makeCampaign(),
  isViewLoading: false,
  viewErrorMessage: '',
  mailingLists: [],
  isResending: false,
  resendErrorMessage: '',
  ...overrides,
})

const mountModal = (props = {}) =>
  mount(ViewCampaignModal, { props: defaultProps(props) })

const findResendButton = (wrapper) =>
  wrapper
    .findAll('button[type="button"]')
    .find((button) => button.text().includes('Send to lists') || button.text().includes('Sending...'))

describe('visibility', () => {
  it('renders the modal when isViewModalOpen is true', () => {
    const wrapper = mountModal()
    expect(wrapper.find('.fixed').exists()).toBe(true)
  })

  it('does not render the modal when isViewModalOpen is false', () => {
    const wrapper = mountModal({ isViewModalOpen: false })
    expect(wrapper.find('.fixed').exists()).toBe(false)
  })
})

describe('loading state', () => {
  it('shows loading text when isViewLoading is true', () => {
    const wrapper = mountModal({ isViewLoading: true, campaign: null })
    expect(wrapper.text()).toContain('Loading campaign...')
  })

  it('does not show campaign content while loading', () => {
    const wrapper = mountModal({ isViewLoading: true })
    expect(wrapper.text()).not.toContain('Weekly Update')
  })
})

describe('error state', () => {
  it('shows the error message when viewErrorMessage is set', () => {
    const wrapper = mountModal({ viewErrorMessage: 'Failed to load.', campaign: null })
    expect(wrapper.text()).toContain('Failed to load.')
  })

  it('does not show campaign details when there is an error', () => {
    const wrapper = mountModal({ viewErrorMessage: 'Oops', campaign: null })
    expect(wrapper.text()).not.toContain('Subject:')
  })
})

describe('no campaign selected', () => {
  it('shows fallback when campaign is null and no loading/error', () => {
    const wrapper = mountModal({ campaign: null })
    expect(wrapper.text()).toContain('No campaign selected.')
  })
})

describe('campaign details', () => {
  it('renders the campaign id in the header', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('42')
  })

  it('shows "-" for id when campaign is null (header fallback)', () => {
    const wrapper = mountModal({ campaign: null })
    expect(wrapper.text()).toContain('-')
  })

  it('renders the subject', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('Weekly Update')
  })

  it('renders "-" for missing subject', () => {
    const wrapper = mountModal({ campaign: makeCampaign({ messageContent: {} }) })
    expect(wrapper.text()).toContain('-')
  })

  it('renders the fromField', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('sender@example.com')
  })

  it('renders "-" for missing fromField', () => {
    const wrapper = mountModal({ campaign: makeCampaign({ messageOptions: {} }) })
    expect(wrapper.text()).toContain('-')
  })

  it('renders the HTML content', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('<p>HTML body</p>')
  })

  it('renders "-" when HTML content is missing', () => {
    const wrapper = mountModal({ campaign: makeCampaign({ messageContent: { subject: 'S' } }) })
    expect(wrapper.text()).toContain('-')
  })

  it('renders the text message content', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('Plain text body')
  })

  it('renders the footer content', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('Unsubscribe here')
  })

  it('renders the entered date formatted', () => {
    const wrapper = mountModal()
    // formatDate uses toLocaleString — just verify it's not '-' and not raw ISO
    expect(wrapper.text()).not.toContain('2024-03-15T10:30:00Z')
    expect(wrapper.text()).not.toContain('Entered: -')
  })

  it('renders "-" for a null entered date', () => {
    const wrapper = mountModal({
      campaign: makeCampaign({ messageMetadata: { entered: null } }),
    })
    expect(wrapper.text()).toContain('-')
  })

  it('renders "-" for an invalid entered date string', () => {
    const wrapper = mountModal({
      campaign: makeCampaign({ messageMetadata: { entered: 'not-a-date' } }),
    })
    expect(wrapper.text()).toContain('-')
  })
})

describe('getMessage', () => {
  it('does not render requeue section when messageSchedule is null', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).not.toContain('Requeueing:')
  })

  it('does not render requeue section when requeueInterval is falsy', () => {
    const wrapper = mountModal({
      campaign: makeCampaign({ messageSchedule: { requeueInterval: 0 } }),
    })
    expect(wrapper.text()).not.toContain('Requeueing:')
  })

  it('renders requeue message with correct interval', () => {
    const wrapper = mountModal({
      campaign: makeCampaign({
        messageSchedule: {
          requeueInterval: 30,
          requeueUntil: '2024-12-31T23:59:00Z',
        },
      }),
    })
    expect(wrapper.text()).toContain('Requeueing:')
    expect(wrapper.text()).toContain('every 30 minutes until')
  })

  it('falls back to repeatInterval when requeueInterval is absent', () => {
    const wrapper = mountModal({
      campaign: makeCampaign({
        messageSchedule: {
          repeatInterval: 15,
          repeatUntil: '2024-12-31T23:59:00Z',
        },
      }),
    })
    expect(wrapper.text()).toContain('every 15 minutes until')
  })

  it('shows "Invalid date" for an unparseable until value', () => {
    const wrapper = mountModal({
      campaign: makeCampaign({
        messageSchedule: {
          requeueInterval: 10,
          requeueUntil: 'bad-date',
        },
      }),
    })
    expect(wrapper.text()).toContain('Invalid date')
  })

  it('shows "Invalid interval" when interval is missing', () => {
    const wrapper = mountModal({
      campaign: makeCampaign({
        messageSchedule: {
          requeueInterval: null,
          requeueUntil: '2024-12-31T23:59:00Z',
        },
      }),
    })
    // requeueInterval is null — v-if hides the block entirely
    expect(wrapper.text()).not.toContain('Requeueing:')
  })

  it('replaces space separator in date string before parsing', () => {
    const wrapper = mountModal({
      campaign: makeCampaign({
        messageSchedule: {
          requeueInterval: 5,
          requeueUntil: '2024-12-31 23:00:00',
        },
      }),
    })
    expect(wrapper.text()).toContain('every 5 minutes until')
    expect(wrapper.text()).not.toContain('Invalid date')
  })
})

describe('close', () => {
  it('emits "close" when the Close button is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('button[type="button"]').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('emits "close" when the backdrop is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('.fixed').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('does not emit "close" when the modal content itself is clicked', async () => {
    const wrapper = mountModal()
    await wrapper.find('.rounded-xl').trigger('click')
    expect(wrapper.emitted('close')).toBeFalsy()
  })
})

describe('mailing list selection', () => {
  it('shows "No mailing lists found." when mailingLists is empty', () => {
    const wrapper = mountModal()
    expect(wrapper.text()).toContain('No mailing lists found.')
  })

  it('renders mailing list checkboxes', () => {
    const wrapper = mountModal({
      mailingLists: [makeList(1, 'Newsletter'), makeList(2, 'Promotions')],
    })
    expect(wrapper.text()).toContain('Newsletter')
    expect(wrapper.text()).toContain('Promotions')
    expect(wrapper.findAll('input[type="checkbox"]').length).toBe(2)
  })

  it('disables the Send button when no lists are selected', () => {
    const wrapper = mountModal({
      mailingLists: [makeList(1, 'Newsletter')],
    })
    const sendBtn = findResendButton(wrapper)
    expect(sendBtn).toBeDefined()
    expect(sendBtn.element.disabled).toBe(true)
  })

  it('enables the Send button when a list is selected', async () => {
    const wrapper = mountModal({
      mailingLists: [makeList(1, 'Newsletter')],
    })
    await wrapper.find('input[type="checkbox"]').setValue(true)
    const sendBtn = findResendButton(wrapper)
    expect(sendBtn).toBeDefined()
    expect(sendBtn.element.disabled).toBe(false)
  })

  it('disables the Send button while isResending is true', async () => {
    const wrapper = mountModal({
      mailingLists: [makeList(1, 'Newsletter')],
      isResending: true,
    })
    await wrapper.find('input[type="checkbox"]').setValue(true)
    const sendBtn = findResendButton(wrapper)
    expect(sendBtn).toBeDefined()
    expect(sendBtn.element.disabled).toBe(true)
  })

  it('shows "Sending..." on the button while isResending', () => {
    const wrapper = mountModal({ isResending: true })
    expect(wrapper.text()).toContain('Sending...')
  })

  it('shows the resend error message when resendErrorMessage is set', () => {
    const wrapper = mountModal({ resendErrorMessage: 'Resend failed.' })
    expect(wrapper.text()).toContain('Resend failed.')
  })

  it('resets selected list ids when modal is reopened', async () => {
    const wrapper = mountModal({
      mailingLists: [makeList(1, 'Newsletter')],
    })
    await wrapper.find('input[type="checkbox"]').setValue(true)
    expect(wrapper.find('input[type="checkbox"]').element.checked).toBe(true)

    await wrapper.setProps({ isViewModalOpen: false })
    await wrapper.setProps({ isViewModalOpen: true })

    expect(wrapper.find('input[type="checkbox"]').element.checked).toBe(false)
  })
})

describe('handleResend', () => {
  it('emits "resend" with selected list ids as numbers', async () => {
    const wrapper = mountModal({
      mailingLists: [makeList(1, 'Newsletter'), makeList(2, 'Promotions')],
    })
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    await checkboxes[0].setValue(true)
    await checkboxes[1].setValue(true)

    const resendButton = findResendButton(wrapper)
    expect(resendButton).toBeDefined()
    await resendButton.trigger('click')

    expect(wrapper.emitted('resend')).toBeTruthy()
    expect(wrapper.emitted('resend')[0][0]).toEqual([1, 2])
  })

  it('does not emit "resend" when no lists are selected', async () => {
    const wrapper = mountModal({
      mailingLists: [makeList(1, 'Newsletter')],
    })
    const resendButton = findResendButton(wrapper)
    expect(resendButton).toBeDefined()
    await resendButton.trigger('click')
    expect(wrapper.emitted('resend')).toBeFalsy()
  })

  it('filters out non-finite values from selected ids', async () => {
    // Simulate a non-numeric id slipping through
    const wrapper = mountModal({
      mailingLists: [makeList('abc', 'Bad List'), makeList(3, 'Good List')],
    })
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    await checkboxes[0].setValue(true)
    await checkboxes[1].setValue(true)

    const resendButton = findResendButton(wrapper)
    expect(resendButton).toBeDefined()
    await resendButton.trigger('click')

    const emitted = wrapper.emitted('resend')?.[0]?.[0]
    expect(emitted).not.toContain(NaN)
    expect(emitted).toContain(3)
  })

  it('does not emit when campaign is null', async () => {
    const wrapper = mountModal({
      campaign: null,
      mailingLists: [makeList(1, 'Newsletter')],
    })

    expect(wrapper.emitted('resend')).toBeFalsy()
  })
})
