// CkEditorField.spec.js

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CkEditorField from '../../../../../../assets/vue/components/base/CkEditorField.vue'

vi.mock('ckeditor5', () => ({
    ClassicEditor: {},
    Essentials: {},
    Paragraph: {},
    Bold: {},
    Italic: {},
    Heading: {},
    Link: {},
    List: {},
    BlockQuote: {},
    Table: {},
    TableToolbar: {},
    HorizontalLine: {},
    Image: {},
    ImageToolbar: {},
    ImageCaption: {},
    ImageStyle: {},
    ImageResize: {},
    AutoImage: {},
    PictureEditing: {},
}))

const CkeditorStub = {
    name: 'ckeditor',
    props: [
        'modelValue',
        'editor',
        'config',
        'id',
    ],
    emits: ['update:modelValue'],
    template: `
    <div class="ckeditor-stub">
      <button
        class="change-value"
        @click="$emit('update:modelValue', '<p>Updated</p>')"
      >
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
                    ckeditor: CkeditorStub,
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

        const editor =
            wrapper.findComponent(CkeditorStub)

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

        const editor =
            wrapper.findComponent(CkeditorStub)

        expect(editor.props('id'))
            .toBe('editor-1')
    })

    it('passes editor instance to ckeditor', () => {
        const wrapper = createWrapper()

        const editor =
            wrapper.findComponent(CkeditorStub)

        expect(editor.props('editor'))
            .toBeDefined()
    })

    it('passes editor config to ckeditor', () => {
        const wrapper = createWrapper()

        const editor =
            wrapper.findComponent(CkeditorStub)

        const config = editor.props('config')

        expect(config.licenseKey)
            .toBe('GPL')

        expect(config.toolbar)
            .toContain('bold')

        expect(config.toolbar)
            .toContain('italic')

        expect(config.toolbar)
            .toContain('insertTable')
    })

    it('contains image toolbar configuration', () => {
        const wrapper = createWrapper()

        const config =
            wrapper.findComponent(CkeditorStub)
                .props('config')

        expect(config.image.toolbar)
            .toContain('toggleImageCaption')

        expect(config.image.toolbar)
            .toContain('imageTextAlternative')
    })
})
