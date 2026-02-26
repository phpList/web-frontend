<template>
  <table class="table align-middle mb-0">
    <thead class="border-bottom">
    <tr class="text-uppercase small text-secondary fw-semibold">
      <th class="ps-0">Campaign Name</th>
      <th>Status</th>
      <th>Date</th>
      <th>Open Rate</th>
      <th class="pe-0">Click Rate</th>
    </tr>
    </thead>

    <tbody>
    <tr
        v-for="row in rows"
        :key="row.id"
        class="border-bottom"
    >
      <td class="ps-0 fw-medium text-dark">
        {{ row.name }}
      </td>

      <td>
          <span
              class="badge rounded-pill fw-semibold text-white"
              :class="statusClass(row.status)"
          >
            {{ row.status }}
          </span>
      </td>

      <td>{{ row.date }}</td>
      <td>{{ row.openRate ?? '—' }}</td>
      <td class="pe-0">{{ row.clickRate ?? '—' }}</td>
    </tr>

    <!-- empty state -->
    <tr v-if="!rows.length">
      <td colspan="5" class="text-center py-4 text-secondary">
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
    sent: 'bg-success bg-opacity-10 text-white px-2',
    scheduled: 'bg-primary bg-opacity-10 text-white px-2',
    draft: 'bg-secondary bg-opacity-10 text-white px-2',
  }[s] || 'bg-light text-dark'
}
</script>
