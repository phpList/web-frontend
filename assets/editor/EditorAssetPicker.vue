<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-asset-picker-title"
      @keydown.esc="$emit('close')"
    >
      <div class="w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl">
        <div class="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
          <div class="min-w-0">
            <h3 id="editor-asset-picker-title" class="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Choose an existing asset
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">Pick a file to insert it at the cursor position.</p>
          </div>

          <button
            type="button"
            class="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            @click="$emit('close')"
          >
            Close
          </button>
        </div>

        <div class="flex flex-col gap-3 border-b border-slate-200 dark:border-slate-700 px-4 py-3 sm:flex-row sm:items-center">
          <input
            ref="searchInput"
            :value="query"
            type="search"
            class="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 dark:bg-slate-800 outline-none focus:border-ext-wf1 focus:ring-2 focus:ring-ext-wf2"
            placeholder="Search by file name"
            @input="$emit('update:query', $event.target.value)"
          >

          <button
            type="button"
            class="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            @click="$emit('refresh')"
          >
            Refresh
          </button>
        </div>

        <div class="max-h-[60vh] overflow-auto">
          <div v-if="loading" class="px-4 py-8 text-sm text-slate-500 dark:text-slate-400">
            Loading assets...
          </div>

          <div v-else-if="error" class="px-4 py-8 text-sm text-red-600 dark:text-red-400">
            {{ error }}
          </div>

          <table v-else class="w-full table-fixed border-separate border-spacing-0">
            <thead class="sticky top-0 bg-slate-50 dark:bg-slate-800">
              <tr class="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <th class="w-24 border-b border-slate-200 dark:border-slate-700 px-4 py-3">Preview</th>
                <th class="border-b border-slate-200 dark:border-slate-700 px-4 py-3">Name</th>
                <th class="w-32 border-b border-slate-200 dark:border-slate-700 px-4 py-3">Type</th>
                <th class="w-28 border-b border-slate-200 dark:border-slate-700 px-4 py-3">Size</th>
                <th class="w-40 border-b border-slate-200 dark:border-slate-700 px-4 py-3">Updated</th>
                <th class="w-28 border-b border-slate-200 dark:border-slate-700 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!filteredItems.length">
                <td colspan="6" class="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No assets found.
                </td>
              </tr>

              <tr
                v-for="item in filteredItems"
                :key="item.url"
                class="border-b border-slate-100 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <td class="px-4 py-3 align-top">
                  <img
                    v-if="item.isImage"
                    :src="item.url"
                    :alt="item.fileName.slice(0, 5) + '...'"
                    class="h-14 w-14 rounded border border-slate-200 dark:border-slate-700 object-cover"
                  >
                  <div
                    v-else
                    class="flex h-14 w-14 items-center justify-center rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400"
                  >
                    {{ extensionLabel(item.fileName) }}
                  </div>
                </td>
                <td class="px-4 py-3 align-top">
                  <p class="break-all font-medium text-slate-900 dark:text-slate-100">{{ item.fileName }}</p>
                  <p class="break-all text-xs text-slate-500 dark:text-slate-400">{{ item.url }}</p>
                </td>
                <td class="px-4 py-3 align-top text-xs uppercase text-slate-500 dark:text-slate-400">
                  {{ item.mimeType }}
                </td>
                <td class="px-4 py-3 align-top text-sm text-slate-600 dark:text-slate-300">
                  {{ formatBytes(item.size) }}
                </td>
                <td class="px-4 py-3 align-top text-sm text-slate-600 dark:text-slate-300">
                  {{ formatDate(item.modifiedAt) }}
                </td>
                <td class="px-4 py-3 align-top text-right">
                  <button
                    type="button"
                    class="rounded-lg bg-ext-wf1 px-3 py-2 text-sm font-medium text-white hover:bg-ext-wf3"
                    @click="$emit('select', item)"
                  >
                    Insert
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
          <span>{{ filteredItems.length }} asset{{ filteredItems.length === 1 ? '' : 's' }}</span>
          <span class="text-xs text-slate-500 dark:text-slate-400">Choose a row to insert it immediately.</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  items: {
    type: Array,
    default: () => [],
  },
  query: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})

defineEmits(['close', 'refresh', 'select', 'update:query'])

const searchInput = ref(null)
let previouslyFocused = null

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      previouslyFocused = document.activeElement
      nextTick(() => {
        searchInput.value?.focus()
      })
    } else if (previouslyFocused instanceof HTMLElement) {
      previouslyFocused.focus()
      previouslyFocused = null
    }
  },
)

const filteredItems = computed(() => {
  const needle = props.query.trim().toLowerCase()

  if (!needle) {
    return props.items
  }

  return props.items.filter((item) => {
    const haystack = `${item.fileName} ${item.mimeType}`.toLowerCase()
    return haystack.includes(needle)
  })
})

const formatBytes = (size) => {
  if (!Number.isFinite(size) || size <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let value = size
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

const formatDate = (timestamp) => {
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return 'Unknown'
  }

  return new Date(timestamp * 1000).toLocaleString()
}

const extensionLabel = (fileName) => {
  const parts = String(fileName).split('.')
  return parts.length > 1 ? parts.pop().toUpperCase() : 'FILE'
}
</script>
