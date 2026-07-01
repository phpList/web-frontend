import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CampaignsTable from '../../../../../../assets/vue/components/dashboard/CampaignsTable.vue'

const makeRow = (overrides = {}) => ({
    id: 1,
    name: 'Spring Newsletter',
    status: 'sent',
    date: 'Jun 1, 2024',
    openRate: '42%',
    clickRate: '12%',
    ...overrides,
})

describe('table structure', () => {
    it('renders all five column headers', () => {
        const wrapper = mount(CampaignsTable)
        const headers = wrapper.findAll('th').map((th) => th.text())
        expect(headers).toContain('Campaign Name')
        expect(headers).toContain('Status')
        expect(headers).toContain('Date')
        expect(headers).toContain('Open Rate')
        expect(headers).toContain('Click Rate')
    })
})

describe('empty state', () => {
    it('shows "No campaigns yet." when rows is empty', () => {
        const wrapper = mount(CampaignsTable)
        expect(wrapper.text()).toContain('No campaigns yet.')
    })

    it('empty state cell spans all 5 columns', () => {
        const wrapper = mount(CampaignsTable)
        expect(wrapper.find('td[colspan="5"]').exists()).toBe(true)
    })

    it('does not show empty state when rows are provided', () => {
        const wrapper = mount(CampaignsTable, { props: { rows: [makeRow()] } })
        expect(wrapper.text()).not.toContain('No campaigns yet.')
    })
})

describe('row rendering', () => {
    it('renders a row for each item in rows', () => {
        const wrapper = mount(CampaignsTable, {
            props: { rows: [makeRow({ id: 1 }), makeRow({ id: 2, name: 'Summer Sale' })] },
        })
        expect(wrapper.findAll('tbody tr').length).toBe(2)
    })

    it('renders the campaign name', () => {
        const wrapper = mount(CampaignsTable, { props: { rows: [makeRow()] } })
        expect(wrapper.text()).toContain('Spring Newsletter')
    })

    it('renders the date', () => {
        const wrapper = mount(CampaignsTable, { props: { rows: [makeRow()] } })
        expect(wrapper.text()).toContain('Jun 1, 2024')
    })

    it('renders the open rate', () => {
        const wrapper = mount(CampaignsTable, { props: { rows: [makeRow()] } })
        expect(wrapper.text()).toContain('42%')
    })

    it('renders the click rate', () => {
        const wrapper = mount(CampaignsTable, { props: { rows: [makeRow()] } })
        expect(wrapper.text()).toContain('12%')
    })

    it('renders "—" when openRate is null', () => {
        const wrapper = mount(CampaignsTable, { props: { rows: [makeRow({ openRate: null })] } })
        expect(wrapper.text()).toContain('—')
    })

    it('renders "—" when clickRate is null', () => {
        const wrapper = mount(CampaignsTable, { props: { rows: [makeRow({ clickRate: null })] } })
        expect(wrapper.text()).toContain('—')
    })

    it('renders "—" when openRate is undefined', () => {
        const wrapper = mount(CampaignsTable, { props: { rows: [makeRow({ openRate: undefined })] } })
        expect(wrapper.text()).toContain('—')
    })
})

describe('statusClass', () => {
    const mountWithStatus = (status) =>
        mount(CampaignsTable, { props: { rows: [makeRow({ status })] } })

    it('applies green classes for "sent"', () => {
        const wrapper = mountWithStatus('sent')
        expect(wrapper.find('span.bg-green-100').exists()).toBe(true)
        expect(wrapper.find('span.text-green-800').exists()).toBe(true)
    })

    it('applies blue classes for "scheduled"', () => {
        const wrapper = mountWithStatus('scheduled')
        expect(wrapper.find('span.bg-blue-100').exists()).toBe(true)
        expect(wrapper.find('span.text-blue-800').exists()).toBe(true)
    })

    it('applies gray classes for "draft"', () => {
        const wrapper = mountWithStatus('draft')
        expect(wrapper.find('span.bg-gray-100').exists()).toBe(true)
        expect(wrapper.find('span.text-gray-800').exists()).toBe(true)
    })

    it('applies gray fallback classes for an unknown status', () => {
        const wrapper = mountWithStatus('paused')
        expect(wrapper.find('span.bg-gray-100').exists()).toBe(true)
        expect(wrapper.find('span.text-gray-800').exists()).toBe(true)
    })

    it('is case-insensitive — "Sent" resolves to green', () => {
        const wrapper = mountWithStatus('Sent')
        expect(wrapper.find('span.bg-green-100').exists()).toBe(true)
    })

    it('is case-insensitive — "SCHEDULED" resolves to blue', () => {
        const wrapper = mountWithStatus('SCHEDULED')
        expect(wrapper.find('span.bg-blue-100').exists()).toBe(true)
    })

    it('renders the status label inside the badge', () => {
        const wrapper = mountWithStatus('sent')
        expect(wrapper.find('span.bg-green-100').text()).toBe('sent')
    })
})
