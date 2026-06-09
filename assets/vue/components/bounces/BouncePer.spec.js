import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import BouncePer from './BouncePer.vue'
import { bouncesClient } from '../../api'

vi.mock('../../api', () => ({
    bouncesClient: {
        listByCampaign: vi.fn(),
        listBySubscriber: vi.fn(),
    },
}))

const makeSubscriber = (overrides = {}) => ({
    subscriber_id: 101,
    email: 'user@example.com',
    confirmed: true,
    blacklisted: false,
    total_bounces: 3,
    ...overrides,
})

const makeCampaign = (overrides = {}) => ({
    message_id: 55,
    subject: 'Weekly Newsletter',
    total_bounces: 7,
    ...overrides,
})

beforeEach(() => {
    vi.clearAllMocks()
    bouncesClient.listByCampaign.mockResolvedValue([])
    bouncesClient.listBySubscriber.mockResolvedValue([])
})

describe('loading states', () => {
    it('no loading text after both APIs resolve', async () => {
        const wrapper = mount(BouncePer)
        await flushPromises()
        expect(wrapper.text()).not.toContain('Loading subscriber bounce data...')
        expect(wrapper.text()).not.toContain('Loading campaign bounce data...')
    })
})

describe('on mount', () => {
    it('calls listBySubscriber once', async () => {
        mount(BouncePer)
        await flushPromises()
        expect(bouncesClient.listBySubscriber).toHaveBeenCalledTimes(1)
    })

    it('calls listByCampaign once', async () => {
        mount(BouncePer)
        await flushPromises()
        expect(bouncesClient.listByCampaign).toHaveBeenCalledTimes(1)
    })
})

describe('empty states', () => {
    it('shows subscriber empty state when the API returns no items', async () => {
        const wrapper = mount(BouncePer)
        await flushPromises()
        expect(wrapper.text()).toContain('No subscriber bounce data found.')
    })

    it('shows campaign empty state when the API returns no items', async () => {
        const wrapper = mount(BouncePer)
        await flushPromises()
        expect(wrapper.text()).toContain('No campaign bounce data found.')
    })
})

describe('error states', () => {
    it('shows subscriber error message on rejection', async () => {
        bouncesClient.listBySubscriber.mockRejectedValue(new Error('Subscriber API down'))
        const wrapper = mount(BouncePer)
        await flushPromises()
        expect(wrapper.text()).toContain('Subscriber API down')
    })

    it('shows campaign error message on rejection', async () => {
        bouncesClient.listByCampaign.mockRejectedValue(new Error('Campaign API down'))
        const wrapper = mount(BouncePer)
        await flushPromises()
        expect(wrapper.text()).toContain('Campaign API down')
    })

    it('shows a generic subscriber fallback when the error has no message', async () => {
        bouncesClient.listBySubscriber.mockRejectedValue({})
        const wrapper = mount(BouncePer)
        await flushPromises()
        expect(wrapper.text()).toContain('Failed to load subscriber bounce data.')
    })

    it('shows a generic campaign fallback when the error has no message', async () => {
        bouncesClient.listByCampaign.mockRejectedValue({})
        const wrapper = mount(BouncePer)
        await flushPromises()
        expect(wrapper.text()).toContain('Failed to load campaign bounce data.')
    })

    it('subscriber error does not bleed into campaign section', async () => {
        bouncesClient.listBySubscriber.mockRejectedValue(new Error('Sub error'))
        bouncesClient.listByCampaign.mockResolvedValue([makeCampaign()])
        const wrapper = mount(BouncePer)
        await flushPromises()
        expect(wrapper.text()).toContain('Sub error')
        expect(wrapper.text()).not.toContain('No campaign bounce data found.')
        expect(wrapper.text()).toContain('Weekly Newsletter')
    })
})

describe('subscriber data normalisation', () => {
    it('renders subscriber id, email, and total bounces', async () => {
        bouncesClient.listBySubscriber.mockResolvedValue([makeSubscriber()])
        const wrapper = mount(BouncePer)
        await flushPromises()
        expect(wrapper.text()).toContain('#101')
        expect(wrapper.text()).toContain('user@example.com')
        expect(wrapper.text()).toContain('3')
    })

    it('falls back to "N/A" when subscriber_id is missing', async () => {
        bouncesClient.listBySubscriber.mockResolvedValue([makeSubscriber({ subscriber_id: null })])
        const wrapper = mount(BouncePer)
        await flushPromises()
        expect(wrapper.text()).toContain('N/A')
    })

    it('falls back to "Unknown email" when email is missing', async () => {
        bouncesClient.listBySubscriber.mockResolvedValue([makeSubscriber({ email: null })])
        const wrapper = mount(BouncePer)
        await flushPromises()
        expect(wrapper.text()).toContain('Unknown email')
    })

    it('falls back to 0 when total_bounces is missing', async () => {
        bouncesClient.listBySubscriber.mockResolvedValue([makeSubscriber({ total_bounces: null })])
        const wrapper = mount(BouncePer)
        await flushPromises()
        expect(wrapper.text()).toContain('0')
    })

    it('handles non-array response gracefully', async () => {
        bouncesClient.listBySubscriber.mockResolvedValue(null)
        const wrapper = mount(BouncePer)
        await flushPromises()
        expect(wrapper.text()).toContain('No subscriber bounce data found.')
    })
})

describe('campaign data normalisation', () => {
    it('renders message id, subject, and total bounces', async () => {
        bouncesClient.listByCampaign.mockResolvedValue([makeCampaign()])
        const wrapper = mount(BouncePer)
        await flushPromises()
        expect(wrapper.text()).toContain('#55')
        expect(wrapper.text()).toContain('Weekly Newsletter')
        expect(wrapper.text()).toContain('7')
    })

    it('falls back to "N/A" when message_id is missing', async () => {
        bouncesClient.listByCampaign.mockResolvedValue([makeCampaign({ message_id: null })])
        const wrapper = mount(BouncePer)
        await flushPromises()
        expect(wrapper.text()).toContain('N/A')
    })

    it('falls back to "No subject" when subject is missing', async () => {
        bouncesClient.listByCampaign.mockResolvedValue([makeCampaign({ subject: null })])
        const wrapper = mount(BouncePer)
        await flushPromises()
        expect(wrapper.text()).toContain('No subject')
    })

    it('falls back to 0 when total_bounces is missing', async () => {
        bouncesClient.listByCampaign.mockResolvedValue([makeCampaign({ total_bounces: null })])
        const wrapper = mount(BouncePer)
        await flushPromises()
        expect(wrapper.text()).toContain('0')
    })

    it('handles non-array response gracefully', async () => {
        bouncesClient.listByCampaign.mockResolvedValue(null)
        const wrapper = mount(BouncePer)
        await flushPromises()
        expect(wrapper.text()).toContain('No campaign bounce data found.')
    })
})

describe('normalizeBoolean', () => {
    const mountWithSubscriber = async (overrides) => {
        bouncesClient.listBySubscriber.mockResolvedValue([makeSubscriber(overrides)])
        const wrapper = mount(BouncePer)
        await flushPromises()
        return wrapper
    }

    describe('confirmed badge', () => {
        it('shows emerald badge for confirmed=true', async () => {
            const wrapper = await mountWithSubscriber({ confirmed: true })
            const badges = wrapper.findAll('span.bg-emerald-100')
            expect(badges.length).toBeGreaterThan(0)
        })

        it('treats confirmed=1 as truthy', async () => {
            const wrapper = await mountWithSubscriber({ confirmed: 1 })
            expect(wrapper.findAll('span.bg-emerald-100').length).toBeGreaterThan(0)
        })

        it('treats confirmed="1" as truthy', async () => {
            const wrapper = await mountWithSubscriber({ confirmed: '1' })
            expect(wrapper.findAll('span.bg-emerald-100').length).toBeGreaterThan(0)
        })

        it('shows slate badge for confirmed=false', async () => {
            const wrapper = await mountWithSubscriber({ confirmed: false, blacklisted: false })
            // both badges are slate when both are false
            const slateBadges = wrapper.findAll('span.bg-slate-100')
            expect(slateBadges.length).toBeGreaterThanOrEqual(2)
        })
    })

    describe('blacklisted badge', () => {
        it('shows rose badge for blacklisted=true', async () => {
            const wrapper = await mountWithSubscriber({ blacklisted: true })
            expect(wrapper.findAll('span.bg-rose-100').length).toBeGreaterThan(0)
        })

        it('treats blacklisted=1 as truthy', async () => {
            const wrapper = await mountWithSubscriber({ blacklisted: 1 })
            expect(wrapper.findAll('span.bg-rose-100').length).toBeGreaterThan(0)
        })

        it('treats blacklisted="1" as truthy', async () => {
            const wrapper = await mountWithSubscriber({ blacklisted: '1' })
            expect(wrapper.findAll('span.bg-rose-100').length).toBeGreaterThan(0)
        })

        it('shows slate badge for blacklisted=false', async () => {
            const wrapper = await mountWithSubscriber({ confirmed: false, blacklisted: false })
            const slateBadges = wrapper.findAll('span.bg-slate-100')
            expect(slateBadges.length).toBeGreaterThanOrEqual(2)
        })
    })
})

describe('section independence', () => {
    it('renders campaign data even when subscriber section errors', async () => {
        bouncesClient.listBySubscriber.mockRejectedValue(new Error('oops'))
        bouncesClient.listByCampaign.mockResolvedValue([makeCampaign()])
        const wrapper = mount(BouncePer)
        await flushPromises()
        expect(wrapper.text()).toContain('Weekly Newsletter')
    })

    it('renders subscriber data even when campaign section errors', async () => {
        bouncesClient.listByCampaign.mockRejectedValue(new Error('oops'))
        bouncesClient.listBySubscriber.mockResolvedValue([makeSubscriber()])
        const wrapper = mount(BouncePer)
        await flushPromises()
        expect(wrapper.text()).toContain('user@example.com')
    })
})
