<template>
  <ckeditor
    :id="fieldId"
    v-model="localValue"
    :editor="ClassicEditor"
    :config="editorConfig"
    :disabled="isDisabled"
    :style="editorStyle"
    @ready="handleReady"
  />

  <EditorAssetPicker
    :open="assetPickerOpen"
    :items="assetItems"
    :query="assetQuery"
    :loading="assetLoading"
    :error="assetError"
    @close="closeAssetPicker"
    @refresh="loadAssets"
    @select="insertAsset"
    @update:query="assetQuery = $event"
  />
</template>

<script setup>
import { computed, onBeforeUnmount, ref, shallowRef, useId, watch } from 'vue';
import { Ckeditor } from '@ckeditor/ckeditor5-vue';
import { ClassicEditor } from 'ckeditor5';

import { DEFAULT_PLUGINS } from './plugins.ts';
import { DEFAULT_IMAGE_TOOLBAR, DEFAULT_TOOLBAR } from './toolbar.ts';
import EditorUploadAdapter from './uploadAdapter.ts';
import EditorAssetPicker from './EditorAssetPicker.vue';

import 'ckeditor5/ckeditor5.css';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  id: {
    type: String,
    default: '',
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  minHeight: {
    type: [Number, String],
    default: 300,
  },
  uploadEndpoint: {
    type: String,
    default: '/editor/upload',
  },
  assetsEndpoint: {
    type: String,
    default: '/editor/assets',
  },
  uploadHeaders: {
    type: Object,
    default: () => ({}),
  },
  withCredentials: {
    type: Boolean,
    default: true,
  },
  toolbar: {
    type: Array,
    default: null,
  },
  plugins: {
    type: Array,
    default: () => [],
  },
  config: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['update:modelValue', 'ready', 'error']);

const generatedId = useId();
const fieldId = computed(() => props.id || `ckeditor-${generatedId}`);

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const editorRef = shallowRef(null);
const assetPickerOpen = ref(false);
const assetLoading = ref(false);
const assetError = ref('');
const assetItems = ref([]);
const assetQuery = ref('');

const isDisabled = computed(() => props.disabled || props.readonly);
const editorStyle = computed(() => ({
  '--editor-min-height': typeof props.minHeight === 'number'
    ? `${props.minHeight}px`
    : String(props.minHeight),
}));

const editorConfig = computed(() => {
  const config = props.config || {};
  const extraPlugins = Array.isArray(config.plugins) ? config.plugins : [];
  const toolbar = Array.isArray(props.toolbar) && props.toolbar.length > 0
    ? props.toolbar
    : Array.isArray(config.toolbar) && config.toolbar.length > 0
      ? config.toolbar
      : DEFAULT_TOOLBAR;

  const imageConfig = {
    toolbar: DEFAULT_IMAGE_TOOLBAR,
    ...(config.image || {}),
  };
  const htmlSupportConfig = config.htmlSupport || {};
  const htmlSupport = {
    allow: htmlSupportConfig.allow || [
      {
        name: /.*/,
        attributes: true,
        classes: true,
        styles: true,
      },
    ],
    disallow: [
      { name: 'script' },
      { name: 'iframe' },
      { name: /.*/, attributes: { key: /^on.*/ } },
      ...(Array.isArray(htmlSupportConfig.disallow) ? htmlSupportConfig.disallow : []),
    ],
  };

  return {
    ...config,
    licenseKey: config.licenseKey || 'GPL',
    plugins: [
      ...DEFAULT_PLUGINS,
      ...(Array.isArray(props.plugins) ? props.plugins : []),
      ...extraPlugins,
    ],
    toolbar,
    image: imageConfig,
    htmlSupport,
    openAssetPicker: openAssetPicker,
  };
});

const installUploadAdapter = (editor) => {
  const fileRepository = editor.plugins.get('FileRepository');

  fileRepository.createUploadAdapter = (loader) => new EditorUploadAdapter(loader, {
    endpoint: props.uploadEndpoint,
    headers: props.uploadHeaders,
    withCredentials: props.withCredentials,
  });
};

const syncReadOnlyState = (editor) => {
  if (props.readonly) {
    editor.enableReadOnlyMode('ckeditor-field');
    return;
  }

  editor.disableReadOnlyMode('ckeditor-field');
};

const loadAssets = async () => {
  assetLoading.value = true;
  assetError.value = '';

  try {
    const response = await fetch(props.assetsEndpoint, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: props.withCredentials ? 'include' : 'same-origin',
    });

    if (!response.ok) {
      throw new Error(`Failed to load assets (${response.status})`);
    }

    const payload = await response.json();
    assetItems.value = Array.isArray(payload?.items) ? payload.items : [];
  } catch (error) {
    assetError.value = error?.message || 'Failed to load assets.';
  } finally {
    assetLoading.value = false;
  }
};

const openAssetPicker = async () => {
  assetPickerOpen.value = true;

  if (assetItems.value.length === 0 && !assetLoading.value) {
    await loadAssets();
  }
};

const closeAssetPicker = () => {
  assetPickerOpen.value = false;
};

const getSelectedEditor = () => editorRef.value;

const insertAsset = (asset) => {
  if (!asset) {
    return;
  }

  const editor = getSelectedEditor();
  if (!editor) {
    return;
  }

  editor.model.change((writer) => {
    if (asset.isImage) {
      const imageElement = writer.createElement('imageBlock', {
        src: asset.url,
        alt: asset.fileName,
      });
      editor.model.insertContent(imageElement, editor.model.document.selection);
      return;
    }

    const linkText = asset.fileName || asset.url;
    const textNode = writer.createText(linkText, { linkHref: asset.url });
    editor.model.insertContent(textNode, editor.model.document.selection);
  });

  closeAssetPicker();
};

const handleReady = (editor) => {
  editorRef.value = editor;
  installUploadAdapter(editor);
  syncReadOnlyState(editor);
  emit('ready', editor);
};

watch(
  () => props.readonly,
  () => {
    if (!editorRef.value) {
      return;
    }

    syncReadOnlyState(editorRef.value);
  }
);

onBeforeUnmount(() => {
  if (!editorRef.value) {
    return;
  }

  const editor = editorRef.value;
  editorRef.value = null;
  editor.destroy();
});
</script>

<style scoped>
:deep(.ck-editor__editable_inline) {
  min-height: var(--editor-min-height, 300px);
  overflow-y: auto;
}
</style>
