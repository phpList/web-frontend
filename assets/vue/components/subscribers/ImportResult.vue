<template>
<div
    v-if="isImportResultOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    @click.self="$emit('close')"
>
<div class="w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-200">
  <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200">
    <h3 class="text-base font-semibold text-slate-900">Import Result</h3>
    <button
        class="text-slate-400 hover:text-slate-600 transition-colors"
        @click="$emit('close')"
    >
      <BaseIcon name="x" class="w-5 h-5" />
    </button>
  </div>

  <div class="p-4 space-y-4">
    <div class="grid grid-cols-2 gap-3">
      <div class="rounded-lg bg-slate-50 border border-slate-200 p-3">
        <div class="text-xs text-slate-500">Imported</div>
        <div class="text-lg font-semibold text-slate-900">
          {{ importResult.imported }}
        </div>
      </div>

      <div class="rounded-lg bg-slate-50 border border-slate-200 p-3">
        <div class="text-xs text-slate-500">Skipped</div>
        <div class="text-lg font-semibold text-slate-900">
          {{ importResult.skipped }}
        </div>
      </div>
    </div>

    <div v-if="importResult.errors && importResult.errors.length">
      <div class="text-sm font-medium text-slate-900 mb-2">Errors</div>
      <div class="max-h-48 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3">
        <ul class="space-y-1 text-sm text-red-700">
          <li v-for="(error, index) in importResult.errors" :key="index">
            {{ error }}
          </li>
        </ul>
      </div>
    </div>

    <div v-else class="text-sm text-green-700 rounded-lg border border-green-200 bg-green-50 p-3">
      Import completed without errors.
    </div>
  </div>

  <div class="px-4 py-3 border-t border-slate-200 flex justify-end">
    <button
        class="px-4 py-2 bg-ext-wf1 hover:bg-ext-wf3 text-white text-sm font-medium rounded-lg transition-colors"
        @click="$emit('close')"
    >
      Close
    </button>
  </div>
</div>
</div>
</template>

<script setup>
import BaseIcon from '../base/BaseIcon.vue'

defineProps({
  isImportResultOpen: {
    type: Boolean,
    required: true
  },
  importResult: {
    type: Object,
    required: true,
    default: () => ({
      imported: 0,
      skipped: 0,
      errors: []
    })
  }
})

defineEmits(['close'])
</script>
