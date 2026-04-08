<template>
  <div class="editor-field" :style="{ '--editor-min-height': `300px` }">
    <label
        v-if="label"
        :for="fieldId"
        class="mb-1 block text-sm font-medium text-slate-700"
    >
      {{ label }}
    </label>

    <ckeditor
        :id="fieldId"
        v-model="localValue"
        :editor="ClassicEditor"
        :config="editorConfig"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Ckeditor } from '@ckeditor/ckeditor5-vue'

import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Heading,
  Link,
  List,
  BlockQuote,
  Table,
  TableToolbar,
  HorizontalLine,

  Image,
  ImageToolbar,
  ImageCaption,
  ImageStyle,
  ImageResize,
  AutoImage,
  PictureEditing
} from 'ckeditor5'

import 'ckeditor5/ckeditor5.css'

defineOptions({
  components: {
    ckeditor: Ckeditor
  }
})

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  id: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const fieldId = props.id || `ckeditor-${crypto.randomUUID()}`

const editorConfig = {
  licenseKey: 'GPL',
  plugins: [
    Essentials,
    Paragraph,
    Bold,
    Italic,
    Heading,
    Link,
    List,
    BlockQuote,
    Table,
    TableToolbar,
    HorizontalLine,
    Image,
    ImageToolbar,
    ImageCaption,
    ImageStyle,
    ImageResize,
    AutoImage,
    PictureEditing
  ],
  toolbar: [
    'undo',
    'redo',
    '|',
    'heading',
    '|',
    'bold',
    'italic',
    'link',
    '|',
    'bulletedList',
    'numberedList',
    '|',
    'blockQuote',
    'insertTable',
    '|',
    'horizontalLine'
  ],
  image: {
    toolbar: [
      'imageStyle:inline',
      'imageStyle:block',
      'imageStyle:side',
      '|',
      'toggleImageCaption',
      'imageTextAlternative'
    ]
  }
}
</script>

<style scoped>
:deep(.ck-editor__editable_inline) {
  min-height: var(--editor-min-height) !important;
  overflow-y: auto;
}
</style>
