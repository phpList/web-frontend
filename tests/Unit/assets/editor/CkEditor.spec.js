import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CkEditor from '../../../../assets/editor/CkEditor.vue'

vi.mock('ckeditor5', () => ({
  ClassicEditor: {},
  Alignment: {},
  AutoImage: {},
  AutoLink: {},
  Autosave: {},
  Essentials: {},
  Paragraph: {},
  Bold: {},
  Italic: {},
  Heading: {},
  Code: {},
  FontBackgroundColor: {},
  FontColor: {},
  FontFamily: {},
  FontSize: {},
  Link: {},
  List: {},
  ListProperties: {},
  BlockQuote: {},
  Highlight: {},
  Table: {},
  TableCaption: {},
  TableCellProperties: {},
  TableColumnResize: {},
  TableLayout: {},
  TableProperties: {},
  TableToolbar: {},
  HorizontalLine: {},
  HtmlEmbed: {},
  SourceEditing: {},
  RemoveFormat: {},
  Strikethrough: {},
  Subscript: {},
  Superscript: {},
  Underline: {},
  TextTransformation: {},
  TodoList: {},
  Indent: {},
  IndentBlock: {},
  MediaEmbed: {},
  Image: {},
  ImageToolbar: {},
  ImageCaption: {},
  ImageStyle: {},
  ImageResize: {},
  ImageUpload: {},
  ImageInsert: {},
  ImageInsertUI: {},
  ImageInsertViaUrl: {},
  ImageInline: {},
  ImageBlock: {},
  LinkImage: {},
  PictureEditing: {},
  PlainTableOutput: {},
  FileRepository: {},
  GeneralHtmlSupport: {},
  Plugin: class {},
  ButtonView: class {},
}))

vi.mock('@ckeditor/ckeditor5-vue', () => ({
  Ckeditor: {
    name: 'ckeditor',
    props: [
      'modelValue',
      'editor',
      'config',
      'id',
      'disabled',
    ],
    emits: ['update:modelValue', 'ready'],
    template: `
      <div class="ckeditor-stub">
        <button class="change-value" @click="$emit('update:modelValue', '<p>Updated</p>')">
          Update
        </button>
        <button class="ready" @click="$emit('ready', {
          plugins: { get: () => ({ createUploadAdapter: null }) },
          enableReadOnlyMode: () => {},
          disableReadOnlyMode: () => {},
          destroy: () => Promise.resolve(),
        })">
          Ready
        </button>
      </div>
    `,
  },
}))

describe('CkEditor', () => {
  const createWrapper = (props = {}) =>
    mount(CkEditor, {
      props: {
        ...props,
      },
    })

  it('syncs v-model updates', async () => {
    const wrapper = createWrapper({ modelValue: '<p>Initial</p>' })

    await wrapper.find('.change-value').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([
      ['<p>Updated</p>'],
    ])
  })

  it('passes the expected editor config', () => {
    const wrapper = createWrapper()

    const editor = wrapper.findComponent({ name: 'ckeditor' })
    const config = editor.props('config')

    expect(config.licenseKey).toBe('GPL')
    expect(config.toolbar).toContain('insertImage')
    expect(config.toolbar).toContain('assetBrowser')
    expect(config.htmlSupport.allow[0].name).toBeDefined()
  })

  it('exposes an asset picker hook in the editor config', () => {
    const wrapper = createWrapper()

    const editor = wrapper.findComponent({ name: 'ckeditor' })
    const config = editor.props('config')

    expect(typeof config.openAssetPicker).toBe('function')
  })

  it('disables the editor when readonly is set', () => {
    const wrapper = createWrapper({ readonly: true })

    const editor = wrapper.findComponent({ name: 'ckeditor' })
    expect(editor.props('disabled')).toBe(true)
  })
})
