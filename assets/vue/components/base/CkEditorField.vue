<template>
  <div class="editor-field" :style="editorFieldStyle">
    <label
        v-if="label"
        :for="fieldId"
        class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
    >
      {{ label }}
    </label>

    <CkEditor
        :id="fieldId"
        v-model="localValue"
        :min-height="minHeight"
        :readonly="readonly"
        :disabled="disabled"
        :upload-endpoint="uploadEndpoint"
        :upload-headers="uploadHeaders"
        :with-credentials="withCredentials"
        :toolbar="toolbar"
        :plugins="plugins"
        :config="config"
    />

    <p v-if="helperText" class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ helperText }}</p>
    <p v-if="errorMessage" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { computed, useId } from 'vue'
import { CkEditor } from '../../../editor/index.ts'

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
  },
  readonly: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  helperText: {
    type: String,
    default: ''
  },
  errorMessage: {
    type: String,
    default: ''
  },
  minHeight: {
    type: [Number, String],
    default: 300
  },
  uploadEndpoint: {
    type: String,
    default: '/editor/upload'
  },
  uploadHeaders: {
    type: Object,
    default: () => ({})
  },
  withCredentials: {
    type: Boolean,
    default: true
  },
  toolbar: {
    type: Array,
    default: null
  },
  plugins: {
    type: Array,
    default: () => []
  },
  config: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const generatedId = useId()
const fieldId = computed(() => props.id || `ckeditor-${generatedId}`)
const editorFieldStyle = computed(() => ({
  '--editor-min-height': typeof props.minHeight === 'number'
    ? `${props.minHeight}px`
    : String(props.minHeight)
}))
</script>

<style scoped>
:deep(.ck-editor__editable_inline) {
  min-height: var(--editor-min-height, 300px) !important;
  overflow-y: auto;
}
</style>
