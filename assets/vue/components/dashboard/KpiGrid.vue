<template>
  <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    <div
      v-for="kpi in kpis"
      :key="kpi.id"
    >
      <KpiCard v-bind="kpi" class="h-full" />
    </div>
  </section>
</template>

<script setup>
import KpiCard from './KpiCard.vue'
// todo: take the data from backend
const kpis = [
  {
    id: 'subscribers',
    label: 'Total Subscribers',
    value: '48,294',
    change: '+12.5%',
    trend: 'up',
    icon: 'users',
  },
  {
    id: 'campaigns',
    label: 'Active Campaigns',
    value: '12',
    change: '0.0%',
    trend: 'neutral',
    icon: 'plane',
  },
  {
    id: 'open-rate',
    label: 'Open Rate',
    value: '12',
    change: '0.0%',
    trend: 'neutral',
    icon: 'rate',
  },
  {
    id: 'bounce-rate',
    label: 'Bounce Rate',
    value: '12',
    change: '0.0%',
    trend: 'neutral',
    icon: 'warning',
  },
]
</script>
