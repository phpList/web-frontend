import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import BounceRules from '../../../../../../assets/vue/components/bounces/BounceRules.vue'
import { bouncesClient } from '../../../../../../assets/vue/api'

vi.mock('../../../../../../assets/vue/api', () => ({
    bouncesClient: {
        listRegex: vi.fn(),
        upsertRegex: vi.fn(),
    },
}))

// ---------------------------------------------------------------------------
// DOM setup — component reads bounce actions from #vue-app dataset
// ---------------------------------------------------------------------------
const setAppDataset = (actions = { 1: 'blacklist', 2: 'soft_bounce', 3: 'delete' }) => {
    let el = document.getElementById('vue-app')
    if (!el) {
        el = document.createElement('div')
        el.id = 'vue-app'
        document.body.appendChild(el)
    }
    el.dataset.bounceActions = JSON.stringify(actions)
}

const makeRule = (overrides = {}) => ({
    id: 1,
    list_order: 1,
    comment: 'Hard bounce rule',
    regex: /550/.source,
    action: 'blacklist',
    count: 42,
    status: 'active',
    actionClass: 'bg-red-100 text-red-700',
    ...overrides,
})

beforeEach(() => {
    vi.clearAllMocks()
    setAppDataset()
    bouncesClient.listRegex.mockResolvedValue([])
    bouncesClient.upsertRegex.mockResolvedValue({})
})

const mountComponent = () => mount(BounceRules)

const openModal = async (wrapper) => {
    await wrapper.find('button[type="button"]').trigger('click')
}

const fillRegex = async (wrapper, value) => {
    await wrapper.find('#bounce-rule-regex').setValue(value)
}

const submitForm = async (wrapper) => {
    await wrapper.find('form').trigger('submit')
}

describe('on mount', () => {
    it('calls listRegex once', async () => {
        mountComponent()
        await flushPromises()
        expect(bouncesClient.listRegex).toHaveBeenCalledTimes(1)
    })

    it('renders rules returned by the API', async () => {
        bouncesClient.listRegex.mockResolvedValue([makeRule()])
        const wrapper = mountComponent()
        await flushPromises()
        expect(wrapper.text()).toContain('Hard bounce rule')
        expect(wrapper.text()).toContain('550')
        expect(wrapper.text()).toContain('42')
    })

    it('renders nothing in the list when the API returns an empty array', async () => {
        const wrapper = mountComponent()
        await flushPromises()
        // no rule rows — heading is still present
        expect(wrapper.text()).toContain('Bounce Rules')
        expect(wrapper.findAll('[class*="border-b last:border-b-0"]').length).toBe(0)
    })

    it('handles a non-array API response gracefully', async () => {
        bouncesClient.listRegex.mockResolvedValue(null)
        const wrapper = mountComponent()
        await flushPromises()
        expect(wrapper.findAll('[class*="border-b last:border-b-0"]').length).toBe(0)
    })

    it('silently clears rules on listRegex error', async () => {
        bouncesClient.listRegex.mockRejectedValue(new Error('Network error'))
        const wrapper = mountComponent()
        await flushPromises()
        expect(wrapper.findAll('[class*="border-b last:border-b-0"]').length).toBe(0)
    })
})

describe('create modal', () => {
    it('is closed on initial render', async () => {
        const wrapper = mountComponent()
        await flushPromises()
        expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    })

    it('opens when "New Rule" is clicked', async () => {
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    })

    it('closes when Cancel is clicked', async () => {
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await wrapper.find('[data-testid="modal-cancel"]').trigger('click')
        await flushPromises()
        expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    })

    it('closes when the backdrop is clicked', async () => {
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await wrapper.find('[aria-hidden="true"]').trigger('click')
        expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    })

    it('resets form fields when re-opened', async () => {
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await fillRegex(wrapper, 'some-regex')

        // close then re-open
        await wrapper.find('button[type="button"]:last-of-type').trigger('click')
        await openModal(wrapper)

        expect(wrapper.find('#bounce-rule-regex').element.value).toBe('')
    })

    it('populates action select with values from dataset', async () => {
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        const options = wrapper.find('#bounce-rule-action').findAll('option')
        const values = options.map((o) => o.text())
        expect(values).toContain('blacklist')
        expect(values).toContain('soft_bounce')
    })

    it('defaults status to "active"', async () => {
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        expect(wrapper.find('#bounce-rule-status').element.value).toBe('active')
    })
})

describe('client-side validation', () => {
    it('shows a regex required error when submitting an empty regex', async () => {
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await submitForm(wrapper)
        expect(wrapper.text()).toContain('Regex is required.')
    })

    it('does not call upsertRegex when regex is empty', async () => {
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await submitForm(wrapper)
        expect(bouncesClient.upsertRegex).not.toHaveBeenCalled()
    })

    it('shows list_order error for a negative number', async () => {
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await fillRegex(wrapper, 'test.*')
        await wrapper.find('#bounce-rule-order').setValue('-1')
        await submitForm(wrapper)
        expect(wrapper.text()).toContain('List Order must be a whole number greater than or equal to 0.')
    })

    it('shows list_order error for a decimal number', async () => {
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await fillRegex(wrapper, 'test.*')
        await wrapper.find('#bounce-rule-order').setValue('1.5')
        await submitForm(wrapper)
        expect(wrapper.text()).toContain('List Order must be a whole number greater than or equal to 0.')
    })

    it('does not call upsertRegex for an invalid list_order', async () => {
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await fillRegex(wrapper, 'test.*')
        await wrapper.find('#bounce-rule-order').setValue('-5')
        await submitForm(wrapper)
        expect(bouncesClient.upsertRegex).not.toHaveBeenCalled()
    })

    it('applies error border class to regex input when it has an error', async () => {
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await submitForm(wrapper)
        expect(wrapper.find('#bounce-rule-regex').classes()).toContain('border-red-300')
    })
})

describe('successful submission', () => {
    it('calls upsertRegex with regex in the payload', async () => {
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await fillRegex(wrapper, '5\\.5\\.0')
        await submitForm(wrapper)
        await flushPromises()
        expect(bouncesClient.upsertRegex).toHaveBeenCalledWith(
            expect.objectContaining({ regex: '5\\.5\\.0' })
        )
    })

    it('omits comment from payload when comment is blank', async () => {
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await fillRegex(wrapper, 'test.*')
        await submitForm(wrapper)
        await flushPromises()
        const payload = bouncesClient.upsertRegex.mock.calls[0][0]
        expect(payload).not.toHaveProperty('comment')
    })

    it('includes comment in payload when provided', async () => {
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await fillRegex(wrapper, 'test.*')
        await wrapper.find('#bounce-rule-comment').setValue('My comment')
        await submitForm(wrapper)
        await flushPromises()
        expect(bouncesClient.upsertRegex).toHaveBeenCalledWith(
            expect.objectContaining({ comment: 'My comment' })
        )
    })

    it('includes list_order as a number when provided', async () => {
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await fillRegex(wrapper, 'test.*')
        await wrapper.find('#bounce-rule-order').setValue('3')
        await submitForm(wrapper)
        await flushPromises()
        expect(bouncesClient.upsertRegex).toHaveBeenCalledWith(
            expect.objectContaining({ list_order: 3 })
        )
    })

    it('closes the modal after a successful submit', async () => {
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await fillRegex(wrapper, 'test.*')
        await submitForm(wrapper)
        await flushPromises()
        expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    })

    it('reloads the rules list after a successful submit', async () => {
        bouncesClient.listRegex
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([makeRule()])
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await fillRegex(wrapper, 'test.*')
        await submitForm(wrapper)
        await flushPromises()
        expect(bouncesClient.listRegex).toHaveBeenCalledTimes(2)
        expect(wrapper.text()).toContain('Hard bounce rule')
    })

    it('shows "Creating..." on the submit button while submitting', async () => {
        let resolve
        bouncesClient.upsertRegex.mockReturnValue(new Promise((res) => { resolve = res }))
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await fillRegex(wrapper, 'test.*')
        await submitForm(wrapper)
        expect(wrapper.find('button[type="submit"]').text()).toBe('Creating...')
        resolve({})
    })

    it('submit and cancel buttons are disabled while submitting', async () => {
        let resolve
        bouncesClient.upsertRegex.mockReturnValue(new Promise((res) => { resolve = res }))
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await fillRegex(wrapper, 'test.*')
        await submitForm(wrapper)
        expect(wrapper.find('[data-testid="modal-submit"]').element.disabled).toBe(true)
        const cancelBtn = wrapper.find('button[type="button"]:last-of-type')
        expect(wrapper.find('[data-testid="modal-cancel"]').element.disabled).toBe(true)
        resolve({})
    })

    it('does not close the modal while submitting is in progress', async () => {
        let resolve
        bouncesClient.upsertRegex.mockReturnValue(new Promise((res) => { resolve = res }))
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await fillRegex(wrapper, 'test.*')
        await submitForm(wrapper)
        // attempt to close via backdrop
        await wrapper.find('[aria-hidden="true"]').trigger('click')
        expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
        resolve({})
    })
})

describe('failed submission', () => {
    it('shows a generic error when upsertRegex rejects without message', async () => {
        bouncesClient.upsertRegex.mockRejectedValue({})
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await fillRegex(wrapper, 'test.*')
        await submitForm(wrapper)
        await flushPromises()
        expect(wrapper.text()).toContain('Failed to create rule.')
    })

    it('shows the error message from the rejection', async () => {
        bouncesClient.upsertRegex.mockRejectedValue(new Error('Server error'))
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await fillRegex(wrapper, 'test.*')
        await submitForm(wrapper)
        await flushPromises()
        expect(wrapper.text()).toContain('Server error')
    })

    it('displays server-side field errors from errors key', async () => {
        bouncesClient.upsertRegex.mockRejectedValue({
            responseData: { errors: { regex: ['Regex already exists.'] } },
        })
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await fillRegex(wrapper, 'duplicate.*')
        await submitForm(wrapper)
        await flushPromises()
        expect(wrapper.text()).toContain('Regex already exists.')
    })

    it('displays server-side field errors from root responseData', async () => {
        bouncesClient.upsertRegex.mockRejectedValue({
            responseData: { regex: ['Invalid pattern.'] },
        })
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await fillRegex(wrapper, 'bad.*')
        await submitForm(wrapper)
        await flushPromises()
        expect(wrapper.text()).toContain('Invalid pattern.')
    })

    it('keeps the modal open after a failed submit', async () => {
        bouncesClient.upsertRegex.mockRejectedValue(new Error('Server error'))
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await fillRegex(wrapper, 'test.*')
        await submitForm(wrapper)
        await flushPromises()
        expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    })

    it('re-enables the submit button after a failed submit', async () => {
        bouncesClient.upsertRegex.mockRejectedValue(new Error('Server error'))
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await fillRegex(wrapper, 'test.*')
        await submitForm(wrapper)
        await flushPromises()
        expect(wrapper.find('button[type="submit"]').element.disabled).toBe(false)
    })
})

describe('normalizeValidationErrors', () => {
    const triggerServerError = async (responseData) => {
        bouncesClient.upsertRegex.mockRejectedValue({ responseData })
        const wrapper = mountComponent()
        await flushPromises()
        await openModal(wrapper)
        await fillRegex(wrapper, 'test.*')
        await submitForm(wrapper)
        await flushPromises()
        return wrapper
    }

    it('shows generic error when responseData is an array', async () => {
        const wrapper = await triggerServerError(['something'])
        expect(wrapper.text()).toContain('Failed to create rule.')
    })

    it('shows generic error when responseData is null', async () => {
        const wrapper = await triggerServerError(null)
        expect(wrapper.text()).toContain('Failed to create rule.')
    })

    it('ignores fields with null message values', async () => {
        const wrapper = await triggerServerError({ regex: null })
        // no field error rendered, falls back to generic
        expect(wrapper.text()).toContain('Failed to create rule.')
    })

    it('coerces non-array messages to an array', async () => {
        const wrapper = await triggerServerError({ regex: 'Single string error.' })
        expect(wrapper.text()).toContain('Single string error.')
    })
})
