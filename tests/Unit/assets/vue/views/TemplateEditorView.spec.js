import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TemplateEditView from '../../../../../assets/vue/views/TemplateEditView.vue'
import * as api from '../../../../../assets/vue/api'

const mockRoute = {
    name: 'template-edit',
    params: {
        templateId: '1',
    },
    query: {},
}

const replace = vi.fn()

vi.mock('vue-router', () => ({
    RouterLink: {
        template: '<a><slot /></a>',
    },
    useRoute: () => mockRoute,
    useRouter: () => ({
        replace,
    }),
}))

describe('TemplateEditView', () => {
    beforeEach(() => {
        vi.restoreAllMocks()

        vi.spyOn(api.templateClient, 'getTemplate').mockResolvedValue({
            id: 1,
            title: 'Welcome Template',
            listOrder: 1,
            content: '<p>Hello World</p>',
            text: 'Hello World',
        })

        vi.spyOn(api.templateClient, 'updateTemplate').mockResolvedValue({})
        vi.spyOn(api.templateClient, 'createTemplate').mockResolvedValue({
            id: 2,
        })
    })

    const mountComponent = async () => {
        const wrapper = mount(TemplateEditView, {
            global: {
                stubs: {
                    AdminLayout: {
                        template: '<div><slot /></div>',
                    },
                    CkEditorField: {
                        props: ['modelValue', 'label'],
                        emits: ['update:modelValue'],
                        template:
                            '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
                    },
                },
            },
        })

        await flushPromises()

        return wrapper
    }

    it('loads the template in edit mode', async () => {
        const wrapper = await mountComponent()
                expect(api.templateClient.getTemplate).toHaveBeenCalledWith(1)

                // The heading shows a generic "Edit Template #<id>" title; the
                // actual template title is rendered inside the title input below.
                const title = wrapper.find('#template-title')

                expect(title.element.value).toBe('Welcome Template')
    })

    it('shows validation when title is empty', async () => {
        const wrapper = await mountComponent()

        await wrapper.find('#template-title').setValue('')
        await wrapper.find('form').trigger('submit.prevent')

        expect(wrapper.text()).toContain('Title is required.')
    })

    it('updates the template', async () => {
        const wrapper = await mountComponent()

        await wrapper.find('#template-title').setValue('Updated Template')

        await wrapper.find('form').trigger('submit.prevent')

        expect(api.templateClient.updateTemplate).toHaveBeenCalledTimes(1)

        expect(wrapper.text()).toContain(
            'Template updated successfully.'
        )
    })

    it('shows field-specific errors returned by the API', async () => {
        vi.spyOn(api.templateClient, 'updateTemplate').mockRejectedValue({
            name: 'ValidationException',
            message: 'Validation failed',
            responseData: {
                title: ['This value is too long.'],
                list_order: ['This value should be a valid number.'],
            },
        })

        const wrapper = await mountComponent()

        await wrapper.find('#template-title').setValue('Updated Template')
        await wrapper.find('form').trigger('submit.prevent')
        await flushPromises()

        expect(wrapper.text()).toContain('Title: This value is too long.')
        expect(wrapper.text()).toContain('List order: This value should be a valid number.')
        expect(wrapper.text()).not.toContain('Validation failed')
    })

    it('creates a template in create mode', async () => {
        mockRoute.name = 'template-create'
        mockRoute.params.templateId = ''

        const wrapper = await mountComponent()

        await wrapper.find('#template-title').setValue('New Template')

        await wrapper.find('form').trigger('submit.prevent')

        expect(api.templateClient.createTemplate).toHaveBeenCalledTimes(1)
        expect(replace).toHaveBeenCalledWith('/templates/2/edit')
    })
})
