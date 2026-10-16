<!--
  Shared desktop-table / mobile-card layout with built-in loading, error
  and empty states. Consumers supply column headers, row cells and the
  mobile card body via scoped slots; everything else (wrapper markup,
  state rows/cards, colspan handling) lives here once.
-->
<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm hidden md:table">
      <thead class="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">
        <tr>
          <slot name="head" />
        </tr>
      </thead>

      <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
        <tr
            v-for="item in items"
            :key="rowKey(item)"
            class="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <slot name="row" :item="item" />
        </tr>

        <tr v-if="isLoading">
          <td :colspan="colspan" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
            {{ loadingMessage }}
          </td>
        </tr>

        <tr v-else-if="loadError">
          <td :colspan="colspan" class="px-6 py-8 text-center text-red-600 dark:text-red-400">
            {{ loadError }}
          </td>
        </tr>

        <tr v-else-if="items.length === 0">
          <td :colspan="colspan" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
            {{ emptyMessage }}
          </td>
        </tr>
      </tbody>
    </table>

    <div class="block md:hidden divide-y divide-slate-100 dark:divide-slate-700">
      <div
          v-for="item in items"
          :key="`mobile-${rowKey(item)}`"
          class="p-4 space-y-3"
      >
        <slot name="card" :item="item" />
      </div>

      <div v-if="isLoading" class="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
        {{ loadingMessage }}
      </div>

      <div v-else-if="loadError" class="px-4 py-8 text-center text-red-600 dark:text-red-400 text-sm">
        {{ loadError }}
      </div>

      <div v-else-if="items.length === 0" class="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
        {{ emptyMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  items: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  loadError: { type: String, default: '' },
  emptyMessage: { type: String, default: 'No items found.' },
  loadingMessage: { type: String, default: 'Loading...' },
  colspan: { type: Number, default: 1 },
  rowKey: { type: Function, default: (item) => item.id }
})
</script>