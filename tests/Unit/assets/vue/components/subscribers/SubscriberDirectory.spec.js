// SubscriberDirectory.spec.js

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SubscriberDirectory from '../../../../../../assets/vue/components/subscribers/SubscriberDirectory.vue'
import { backendFetch, subscribersClient } from '../../../../../../assets/vue/api'

vi.mock('../../../../../../assets/vue/api', () => ({
    backendFetch: vi.fn(),
    subscribersClient: {
        importSubscribers: vi.fn(),
    },
}))

const BaseIconStub = {
    template: '<span />',
}

const SubscriberFiltersStub = {
    name: 'SubscriberFilters',
    emits: ['filter-change'],
    template: '<div />',
}

const SubscriberTableStub = {
    name: 'SubscriberTable',
    props: ['subscribers'],
    emits: ['view'],
    template: '<div />',
}

const SubscriberModalStub = {
    name: 'SubscriberModal',
    props: ['isOpen', 'subscriberId'],
    emits: ['close', 'updated'],
    template: '<div />',
}

const ImportResultStub = {
    name: 'ImportResult',
    props: ['isImportResultOpen', 'importResult'],
    emits: ['close'],
    template: '<div />',
}

const ListSubscribersExportPanelStub = {
    name: 'ListSubscribersExportPanel',
    props: ['directoryFilter'],
    template: '<div />',
}

describe('SubscriberDirectory', () => {
    const createSubscribers = () => ([
        {
            id: 1,
            email: 'john@example.com',
            confirmed: true,
            blacklisted: false,
            listCount: 2,
        },
    ])

    const createPagination = () => ({
        total: 1,
        isFirstPage: true,
        hasMore: false,
        afterId: null,
        prevId: null,
    })


    const createWrapper = () =>
        mount(SubscriberDirectory, {
            global: {
                provide: {
                    subscribers: createSubscribers(),
                    pagination: createPagination(),
                },
                stubs: {
                    BaseIcon: BaseIconStub,
                    SubscriberFilters: SubscriberFiltersStub,
                    SubscriberTable: SubscriberTableStub,
                    SubscriberModal: SubscriberModalStub,
                    ImportResult: ImportResultStub,
                    ListSubscribersExportPanel: ListSubscribersExportPanelStub,
                },
            },
        })

    beforeEach(() => {
        vi.clearAllMocks()

        backendFetch.mockResolvedValue({
            json: () =>
                Promise.resolve({
                    items: subscribers,
                    pagination,
                }),
        })
    })

    it('fetches subscribers on mount', async () => {
        createWrapper()

        await flushPromises()

        expect(backendFetch).toHaveBeenCalled()
    })

    it('passes subscribers to table', async () => {
        const wrapper = createWrapper()

        await flushPromises()

        const table = wrapper.findComponent(SubscriberTableStub)

        expect(table.props('subscribers')).toEqual(
            createSubscribers()
        )
    })

    it('opens subscriber modal', async () => {
        const wrapper = createWrapper()

        await wrapper
            .findComponent(SubscriberTableStub)
            .vm.$emit('view', 123)

        const modal = wrapper.findComponent(
            SubscriberModalStub
        )

        expect(modal.props('isOpen')).toBe(true)
        expect(modal.props('subscriberId')).toBe(123)
    })

    it('closes subscriber modal', async () => {
        const wrapper = createWrapper()

        await wrapper
            .findComponent(SubscriberTableStub)
            .vm.$emit('view', 123)

        await wrapper
            .findComponent(SubscriberModalStub)
            .vm.$emit('close')

        const modal = wrapper.findComponent(
            SubscriberModalStub
        )

        expect(modal.props('isOpen')).toBe(false)
        expect(modal.props('subscriberId')).toBe(null)
    })

    it('updates subscriber after edit', async () => {
        const wrapper = createWrapper()

        await wrapper
            .findComponent(SubscriberModalStub)
            .vm.$emit('updated', {
                id: 1,
                email: 'updated@example.com',
                confirmed: false,
                blacklisted: true,
                subscribedLists: [1, 2, 3],
            })

        const table = wrapper.findComponent(
            SubscriberTableStub
        )

        expect(
            table.props('subscribers')[0].email
        ).toBe('updated@example.com')

        expect(
            table.props('subscribers')[0].listCount
        ).toBe(3)
    })

    it('handles filter changes', async () => {
        const wrapper = createWrapper()

        await wrapper
            .findComponent(SubscriberFiltersStub)
            .vm.$emit('filter-change', 'confirmed')

        expect(backendFetch).toHaveBeenCalledTimes(2)
    })

    it('goes to next page', async () => {
        backendFetch.mockResolvedValue({
            json: () =>
                Promise.resolve({
                    items: createSubscribers(),
                    pagination: {
                        ...createPagination(),
                        hasMore: true,
                        afterId: 10,
                    },
                }),
        })

        const wrapper = createWrapper()

        await flushPromises()

        const buttons = wrapper.findAll('button')
        const nextButton =
            buttons[buttons.length - 1]

        await nextButton.trigger('click')

        expect(backendFetch).toHaveBeenCalledTimes(2)
    })

    it('opens file picker when import button clicked', async () => {
        const wrapper = createWrapper()

        const clickMock = vi.fn()

        wrapper.vm.fileInput = {
            click: clickMock,
        }

        const button = wrapper
            .findAll('button')
            .find(btn =>
                btn.text().includes('Import CSV')
            )

        await button.trigger('click')

        expect(clickMock).toHaveBeenCalled()
    })

    it('imports subscribers', async () => {
        subscribersClient.importSubscribers
            .mockResolvedValue({
                imported: 5,
                skipped: 1,
                errors: [],
            })

        const wrapper = createWrapper()

        const file = new File(
            ['test'],
            'users.csv',
            { type: 'text/csv' }
        )

        await wrapper.vm.handleFileChange({
            target: {
                files: [file],
                value: 'users.csv',
            },
        })

        expect(
            subscribersClient.importSubscribers
        ).toHaveBeenCalled()

        const importModal =
            wrapper.findComponent(ImportResultStub)

        expect(
            importModal.props('isImportResultOpen')
        ).toBe(true)
    })

    it('passes current filter to export panel', async () => {
        const wrapper = createWrapper()

        await wrapper
            .findComponent(SubscriberFiltersStub)
            .vm.$emit('filter-change', 'confirmed')

        const exportPanel =
            wrapper.findComponent(
                ListSubscribersExportPanelStub
            )

        expect(
            exportPanel.props('directoryFilter')
        ).toBe('confirmed')
    })
})
