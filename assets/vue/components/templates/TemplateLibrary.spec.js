// TemplateLibrary.spec.js

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TemplateLibrary from './TemplateLibrary.vue'
import { templateClient } from '../../api'

const pushMock = vi.fn()

vi.mock('vue-router', () => ({
    useRouter: () => ({
        push: pushMock,
    }),
}))

vi.mock('../../api', () => ({
    templateClient: {
        getTemplates: vi.fn(),
        deleteTemplate: vi.fn(),
        getDefaultTemplates: vi.fn(),
        createFromDefault: vi.fn(),
    },
}))

const BaseIconStub = {
    name: 'BaseIcon',
    template: '<span />',
}

describe('TemplateLibrary', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        window.confirm = vi.fn()

        templateClient.getTemplates.mockResolvedValue({
            items: [],
        })
    })

    const createWrapper = () =>
        mount(TemplateLibrary, {
            global: {
                stubs: {
                    BaseIcon: BaseIconStub,
                },
            },
        })

    it('loads templates on mount', async () => {
        templateClient.getTemplates.mockResolvedValue({
            items: [],
        })

        createWrapper()

        await flushPromises()

        expect(templateClient.getTemplates)
            .toHaveBeenCalledWith(0, 1000)
    })

    it('shows empty state', async () => {
        const wrapper = createWrapper()

        await flushPromises()

        expect(wrapper.text())
            .toContain('No templates found.')
    })

    it('shows load error', async () => {
        templateClient.getTemplates
            .mockRejectedValue(new Error())

        const wrapper = createWrapper()

        await flushPromises()

        expect(wrapper.text())
            .toContain('Failed to load templates.')
    })

    it('renders templates', async () => {
        templateClient.getTemplates.mockResolvedValue({
            items: [
                {
                    id: 1,
                    title: 'Newsletter',
                },
            ],
        })

        const wrapper = createWrapper()

        await flushPromises()

        expect(wrapper.text())
            .toContain('Newsletter')
    })

    it('sorts templates by listOrder', async () => {
        templateClient.getTemplates.mockResolvedValue({
            items: [
                {
                    id: 2,
                    title: 'Second',
                    listOrder: 2,
                },
                {
                    id: 1,
                    title: 'First',
                    listOrder: 1,
                },
            ],
        })

        const wrapper = createWrapper()

        await flushPromises()

        const titles = wrapper
            .findAll('h3')
            .map(node => node.text())

        expect(titles).toEqual([
            'First',
            'Second',
        ])
    })

    it('navigates to create template page', async () => {
        const wrapper = createWrapper()

        await flushPromises()

        const button = wrapper
            .findAll('button')
            .find(btn =>
                btn.text().includes('New Template')
            )

        await button.trigger('click')

        expect(pushMock)
            .toHaveBeenCalledWith('/templates/create')
    })

    it('navigates to edit template page', async () => {
        templateClient.getTemplates.mockResolvedValue({
            items: [
                {
                    id: 123,
                    title: 'Template',
                },
            ],
        })

        const wrapper = createWrapper()

        await flushPromises()

        const button = wrapper
            .findAll('button')
            .find(btn => btn.text().includes('Edit'))

        await button.trigger('click')

        expect(pushMock)
            .toHaveBeenCalledWith('/templates/123/edit')
    })

    it('deletes a template', async () => {
        window.confirm.mockReturnValue(true)

        templateClient.getTemplates.mockResolvedValue({
            items: [
                {
                    id: 1,
                    title: 'Template',
                },
            ],
        })

        templateClient.deleteTemplate
            .mockResolvedValue()

        const wrapper = createWrapper()

        await flushPromises()

        const button = wrapper
            .findAll('button')
            .find(btn => btn.text().includes('Delete'))

        await button.trigger('click')

        expect(templateClient.deleteTemplate)
            .toHaveBeenCalledWith(1)
    })

    it('does not delete when confirmation is cancelled', async () => {
        window.confirm.mockReturnValue(false)

        templateClient.getTemplates.mockResolvedValue({
            items: [
                { id: 1, title: 'Template' },
            ],
        })

        const wrapper = createWrapper()

        await flushPromises()

        const button = wrapper
            .findAll('button')
            .find(btn => btn.text().includes('Delete'))

        await button.trigger('click')

        expect(templateClient.deleteTemplate)
            .not.toHaveBeenCalled()
    })

    it('opens default template modal', async () => {
        templateClient.getDefaultTemplates
            .mockResolvedValue([])

        const wrapper = createWrapper()

        await flushPromises()

        const button = wrapper
            .findAll('button')
            .find(btn =>
                btn.text().includes('Add Template From Default')
            )

        await button.trigger('click')

        expect(
            wrapper.find('#default-template-select')
                .exists()
        ).toBe(true)
    })

    it('loads default templates', async () => {
        templateClient.getDefaultTemplates
            .mockResolvedValue([
                {
                    key: 'newsletter',
                    name: 'Newsletter',
                },
            ])

        const wrapper = createWrapper()

        await flushPromises()

        const button = wrapper
            .findAll('button')
            .find(btn =>
                btn.text().includes('Add Template From Default')
            )

        await button.trigger('click')

        await flushPromises()

        expect(
            templateClient.getDefaultTemplates
        ).toHaveBeenCalled()

        expect(wrapper.text())
            .toContain('Newsletter')
    })

    it('creates template from default', async () => {
        templateClient.getDefaultTemplates
            .mockResolvedValue([
                {
                    key: 'newsletter',
                    name: 'Newsletter',
                },
            ])

        templateClient.createFromDefault
            .mockResolvedValue()

        const wrapper = createWrapper()

        await flushPromises()

        const openButton = wrapper
            .findAll('button')
            .find(btn =>
                btn.text().includes('Add Template From Default')
            )

        await openButton.trigger('click')
        await flushPromises()

        await wrapper
            .find('#default-template-select')
            .setValue('newsletter')

        await wrapper.find('form')
            .trigger('submit')

        await flushPromises()

        expect(templateClient.createFromDefault)
            .toHaveBeenCalledWith('newsletter')
    })

    it('shows create from default validation error', async () => {
        templateClient.getDefaultTemplates
            .mockResolvedValue([
                {
                    key: 'newsletter',
                    name: 'Newsletter',
                },
            ])

        const wrapper = createWrapper()

        await flushPromises()

        const openButton = wrapper
            .findAll('button')
            .find(btn =>
                btn.text().includes('Add Template From Default')
            )

        await openButton.trigger('click')
        await flushPromises()

        await wrapper.find('form')
            .trigger('submit')

        expect(wrapper.text())
            .toContain(
                'Please select a default template.'
            )
    })

    it('shows create from default api errors', async () => {
        templateClient.getDefaultTemplates
            .mockResolvedValue([
                {
                    key: 'newsletter',
                    name: 'Newsletter',
                },
            ])

        templateClient.createFromDefault
            .mockRejectedValue(
                new Error('Failed to create')
            )

        const wrapper = createWrapper()

        await flushPromises()

        const openButton = wrapper
            .findAll('button')
            .find(btn =>
                btn.text().includes('Add Template From Default')
            )

        await openButton.trigger('click')
        await flushPromises()

        await wrapper
            .find('#default-template-select')
            .setValue('newsletter')

        await wrapper.find('form')
            .trigger('submit')

        await flushPromises()

        expect(wrapper.text())
            .toContain('Failed to create')
    })

    it('renders template image', async () => {
        templateClient.getTemplates.mockResolvedValue({
            items: [
                {
                    id: 1,
                    images: [
                        {
                            mimetype: 'image/png',
                            data: 'abc123',
                        },
                    ],
                },
            ],
        })

        const wrapper = createWrapper()

        await flushPromises()

        const image = wrapper.find('img')

        expect(image.attributes('src'))
            .toBe(
                'data:image/png;base64,abc123'
            )
    })

    it.each([
        [
            {
                content: '<p>html</p>',
                text: 'text',
            },
            'html + text',
        ],
        [
            {
                content: '<p>html</p>',
            },
            'html',
        ],
        [
            {
                text: 'text',
            },
            'text',
        ],
        [
            {},
            'empty',
        ],
    ])(
        'renders template type %s',
        async (template, expected) => {
            templateClient.getTemplates
                .mockResolvedValue({
                    items: [
                        {
                            id: 1,
                            ...template,
                        },
                    ],
                })

            const wrapper = createWrapper()

            await flushPromises()

            expect(wrapper.text())
                .toContain(expected)
        }
    )
})
