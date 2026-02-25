<template>
  <table class="campaigns-table">
    <thead>
    <tr>
      <th>Campaign Name</th>
      <th>Status</th>
      <th>Date</th>
      <th>Open Rate</th>
      <th>Click Rate</th>
    </tr>
    </thead>

    <tbody>
    <tr
        v-for="row in rows"
        :key="row.id"
    >
      <td class="campaigns-table__name">
        {{ row.name }}
      </td>

      <td>
          <span
              class="campaigns-table__status"
              :class="`campaigns-table__status--${row.status.toLowerCase()}`"
          >
            {{ row.status }}
          </span>
      </td>

      <td>{{ row.date }}</td>
      <td>{{ row.openRate ?? '—' }}</td>
      <td>{{ row.clickRate ?? '—' }}</td>
    </tr>

    <tr v-if="!rows.length">
      <td colspan="5" class="campaigns-table__empty">
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
    /*
      rows: [
        {
          id: 1,
          name: 'Monthly Newsletter - June',
          status: 'Sent',        // 'Sent' | 'Scheduled' | 'Draft' etc.
          date: '2024-06-01',
          openRate: '24.5%',
          clickRate: '3.2%',
        }
      ]
    */
  },
})
</script>

<style scoped>
.campaigns-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
}

thead tr {
  border-bottom: 1px solid #e5e7eb;
}

th {
  text-align: left;
  padding: 0.6rem 1rem 0.6rem 0;
  font-weight: 600;
  color: #9ca3af;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

th:last-child,
td:last-child {
  padding-right: 0;
}

tbody tr {
  border-bottom: 1px solid #f3f4f6;
}

td {
  padding: 0.65rem 1rem 0.65rem 0;
  color: #111827;
}

.campaigns-table__name {
  font-weight: 500;
  color: #111827;
}

.campaigns-table__status {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* tweak colors to match your palette */
.campaigns-table__status--sent {
  background: #ecfdf3;
  color: #15803d;
}

.campaigns-table__status--scheduled {
  background: #eff6ff;
  color: #1d4ed8;
}

.campaigns-table__status--draft {
  background: #f9fafb;
  color: #4b5563;
}

.campaigns-table__empty {
  text-align: center;
  padding: 1.2rem 0;
  color: #6b7280;
}
</style>
