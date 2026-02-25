<template>
  <section class="row g-4 mb-4">
    <div
      v-for="kpi in kpis"
      :key="kpi.id"
      class="col-12 col-sm-6 col-lg-4"
    >
      <KpiCard v-bind="kpi" class="h-100" />
    </div>
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
