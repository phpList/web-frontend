<template>
  <table class="w-full text-left border-collapse">
    <thead class="border-b border-gray-200 dark:border-slate-700">
    <tr class="uppercase text-xs text-gray-500 font-semibold dark:text-slate-400">
      <th class="py-3 pr-4">Campaign Name</th>
      <th class="py-3 px-4">Status</th>
      <th class="py-3 px-4">Date</th>
      <th class="py-3 px-4">Open Rate</th>
      <th class="py-3 pl-4">Click Rate</th>
    </tr>
    </thead>

    <tbody>
    <tr
        v-for="row in rows"
        :key="row.id"
        class="border-b border-gray-200 last:border-0 hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-700"
    >
      <td class="py-3 pr-4 font-medium text-gray-900 dark:text-slate-100">
        {{ row.name }}
      </td>

      <td class="py-3 px-4">
          <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
              :class="statusClass(row.status)"
          >
            {{ row.status }}
          </span>
      </td>

      <td class="py-3 px-4 text-sm text-gray-500 dark:text-slate-400">{{ row.date }}</td>
      <td class="py-3 px-4 text-sm text-gray-500 dark:text-slate-400">{{ row.openRate ?? '—' }}</td>
      <td class="py-3 pl-4 text-sm text-gray-500 dark:text-slate-400">{{ row.clickRate ?? '—' }}</td>
    </tr>

    <!-- empty state -->
    <tr v-if="!rows.length">
      <td colspan="5" class="text-center py-8 text-gray-500 dark:text-slate-400">
        No campaigns yet.
      </td>
    </tr>
    </tbody>
  </table>
</template>

<script setup>
const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
})

const statusClass = (status) => {
  const s = status.toLowerCase()

  return {
    sent: 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400',
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400',
    draft: 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300',
  }[s] || 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300'
}
</script>
