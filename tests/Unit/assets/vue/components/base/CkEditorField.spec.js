import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CkEditorField from '../../../../../../assets/vue/components/base/CkEditorField.vue'

const CkEditorStub = {
    name: 'CkEditor',
    props: [
        'modelValue',
        'id',
        'readonly',
        'disabled',
        'minHeight',
        'uploadEndpoint',
        'uploadHeaders',
        'withCredentials',
        'toolbar',
        'plugins',
        'config',
    ],
    emits: ['update:modelValue'],
    template: `
      <div class="ckeditor-stub">
        <button class="change-value" @click="$emit('update:modelValue', '<p>Updated</p>')">
          Update
        </button>
      </div>
    `,
}

describe('CkEditorField', () => {
    const createWrapper = (props = {}) =>
        mount(CkEditorField, {
            props: {
                ...props,
            },
            global: {
                stubs: {
                    CkEditor: CkEditorStub,
                },
            },
        })

    it('renders label when provided', () => {
        const wrapper = createWrapper({
            label: 'Content',
        })

        expect(wrapper.text()).toContain('Content')
    })

    it('does not render label when not provided', () => {
        const wrapper = createWrapper()

        expect(wrapper.find('label').exists())
            .toBe(false)
    })

    it('passes modelValue to ckeditor', () => {
        const wrapper = createWrapper({
            modelValue: '<p>Hello</p>',
        })

        const editor = wrapper.findComponent(CkEditorStub)

        expect(editor.props('modelValue'))
            .toBe('<p>Hello</p>')
    })

    it('emits update:modelValue', async () => {
        const wrapper = createWrapper()

        await wrapper
            .find('.change-value')
            .trigger('click')

        expect(
            wrapper.emitted('update:modelValue')
        ).toEqual([
            ['<p>Updated</p>'],
        ])
    })

    it('uses provided id', () => {
        const wrapper = createWrapper({
            id: 'content-editor',
            label: 'Content',
        })

        const label = wrapper.find('label')

        expect(label.attributes('for'))
            .toBe('content-editor')
    })

    it('generates an id when one is not provided', () => {
        const wrapper = createWrapper({
            label: 'Content',
        })

        const label = wrapper.find('label')

        expect(
            label.attributes('for')
        ).toMatch(/^ckeditor-/)
    })

    it('passes id to ckeditor', () => {
        const wrapper = createWrapper({
            id: 'editor-1',
        })

        const editor = wrapper.findComponent(CkEditorStub)

        expect(editor.props('id'))
            .toBe('editor-1')
    })

    it('passes editor options through to the editor component', () => {
        const wrapper = createWrapper()

        const editor = wrapper.findComponent(CkEditorStub)

        expect(editor.props('uploadEndpoint'))
            .toBe('/editor/upload')

        expect(editor.props('minHeight'))
            .toBe(300)
    })

    it('forwards custom config and toolbar props', () => {
        const toolbar = ['undo', 'bold']
        const wrapper = createWrapper({
            toolbar,
            config: { placeholder: 'Write here' },
        })

        const editor = wrapper.findComponent(CkEditorStub)
        expect(editor.props('toolbar')).toEqual(toolbar)
        expect(editor.props('config')).toEqual({ placeholder: 'Write here' })
    })
})
