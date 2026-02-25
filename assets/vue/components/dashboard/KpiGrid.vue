<template>
  <section class="kpi-grid">
    <KpiCard
        v-for="kpi in kpis"
        :key="kpi.id"
        v-bind="kpi"
    />
  </section>
</template>

<script setup>
import KpiCard from './KpiCard.vue'

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
    icon: 'send',
  },
  // ...
]
</script>
