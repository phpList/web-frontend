// ListSubscribersExportPanel.spec.js

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ListSubscribersExportPanel from './ListSubscribersExportPanel.vue'
import client from '../../api'

vi.mock('../../api', () => ({
    default: {
        get: vi.fn(),
    },
    subscriberAttributesClient: {},
}))

describe('ListSubscribersExportPanel', () => {
    const createWrapper = (props = {}) =>
        mount(ListSubscribersExportPanel, {
            props,
        })

    beforeEach(() => {
        vi.clearAllMocks()

        client.get.mockResolvedValue({
            items: [],
        })

        delete window.location
        window.location = {
            href: '',
        }
    })

    it('loads attribute definitions on mount', async () => {
        client.get.mockResolvedValue({
            items: [
                { name: 'firstName' },
                { name: 'lastName' },
            ],
        })

        const wrapper = createWrapper()

        await flushPromises()

        expect(client.get).toHaveBeenCalledWith(
            'attributes',
            {
                limit: 100,
                offset: 0,
            }
        )

        expect(wrapper.text()).toContain('FirstName')
        expect(wrapper.text()).toContain('LastName')
    })

    it('disables date inputs when date type is any', () => {
        const wrapper = createWrapper()

        const dateFrom = wrapper.find('#list-export-date-from')
        const dateTo = wrapper.find('#list-export-date-to')

        expect(dateFrom.attributes('disabled')).toBeDefined()
        expect(dateTo.attributes('disabled')).toBeDefined()
    })

    it('enables date inputs for signup date type', async () => {
        const wrapper = createWrapper()

        await wrapper
            .find('input[value="signup"]')
            .setValue()

        expect(
            wrapper.find('#list-export-date-from')
                .attributes('disabled')
        ).toBeUndefined()

        expect(
            wrapper.find('#list-export-date-to')
                .attributes('disabled')
        ).toBeUndefined()
    })

    it('clears dates when switching back to any', async () => {
        const wrapper = createWrapper()

        await wrapper
            .find('input[value="signup"]')
            .setValue()

        await wrapper
            .find('#list-export-date-from')
            .setValue('2025-01-01')

        await wrapper
            .find('#list-export-date-to')
            .setValue('2025-01-31')

        await wrapper
            .find('input[value="any"]')
            .setValue()

        expect(
            wrapper.find('#list-export-date-from')
                .element.value
        ).toBe('')

        expect(
            wrapper.find('#list-export-date-to')
                .element.value
        ).toBe('')
    })

    it('unselects all columns', async () => {
        const wrapper = createWrapper()

        await flushPromises()

        const selectAll = wrapper
            .find('input[type="checkbox"]:not([value])')

        await selectAll.setValue(false)

        const exportButton = wrapper
            .find('button')

        await exportButton.trigger('click')

        expect(wrapper.text()).toContain(
            'Select at least one column.'
        )
    })

    it('selects all columns', async () => {
        const wrapper = createWrapper()

        await flushPromises()

        const columnCheckboxes = wrapper
            .findAll('input[type="checkbox"]')
            .slice(1)

        columnCheckboxes.forEach(cb => {
            expect(cb.element.checked).toBe(true)
        })
    })

    it('validates date range', async () => {
        const wrapper = createWrapper()

        await wrapper
            .find('input[value="signup"]')
            .setValue()

        await wrapper
            .find('#list-export-date-from')
            .setValue('2025-12-31')

        await wrapper
            .find('#list-export-date-to')
            .setValue('2025-01-01')

        await wrapper.find('button').trigger('click')

        expect(wrapper.text()).toContain(
            'Date From cannot be after Date To.'
        )
    })

    it('exports subscribers with list id', async () => {
        const wrapper = createWrapper({
            listId: 123,
        })

        await flushPromises()

        await wrapper.find('button').trigger('click')

        expect(window.location.href)
            .toContain('/subscribers/export?')

        expect(window.location.href)
            .toContain('list_id=123')

        expect(window.location.href)
            .toContain('date_type=any')
    })

    it('includes directory filter', async () => {
        const wrapper = createWrapper({
            directoryFilter: 'confirmed',
        })

        await flushPromises()

        await wrapper.find('button').trigger('click')

        expect(window.location.href)
            .toContain('confirmed=true')
    })

    it('includes date parameters', async () => {
        const wrapper = createWrapper()

        await wrapper
            .find('input[value="signup"]')
            .setValue()

        await wrapper
            .find('#list-export-date-from')
            .setValue('2025-01-01')

        await wrapper
            .find('#list-export-date-to')
            .setValue('2025-01-31')

        await wrapper.find('button').trigger('click')

        expect(window.location.href)
            .toContain('date_type=signup')

        expect(window.location.href)
            .toContain('date_from=2025-01-01')

        expect(window.location.href)
            .toContain('date_to=2025-01-31')
    })

    it('includes selected columns', async () => {
        const wrapper = createWrapper()

        await flushPromises()

        await wrapper.find('button').trigger('click')

        expect(window.location.href)
            .toContain('columns%5B%5D=id')

        expect(window.location.href)
            .toContain('columns%5B%5D=email')
    })

    it('sets checkbox indeterminate state', async () => {
        const wrapper = createWrapper()

        await flushPromises()

        const columnCheckboxes = wrapper
            .findAll('input[type="checkbox"]')
            .slice(1)

        await columnCheckboxes[0].setValue(false)

        const selectAll = wrapper
            .find('input[type="checkbox"]:not([value])')

        expect(selectAll.element.indeterminate)
            .toBe(true)
    })

    it('loads multiple attribute pages', async () => {
        client.get
            .mockResolvedValueOnce({
                items: Array.from({ length: 100 }, (_, i) => ({
                    name: `field${i}`,
                })),
            })
            .mockResolvedValueOnce({
                items: [
                    { name: 'extraField' },
                ],
            })

        createWrapper()

        await flushPromises()

        expect(client.get).toHaveBeenCalledTimes(2)
    })
})
