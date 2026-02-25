<template>
  <BaseCard class="chart-card">
    <header class="chart-card__header">
      <h2>Campaign Performance</h2>
      <p>Daily opens and clicks for the last 30 days</p>
    </header>
    <LineChart :series="series" :labels="labels" />
  </BaseCard>
</template>

<script setup>
import BaseCard from './components/base/BaseCard.vue'
import LineChart from './components/charts/LineChart.vue'

const props = defineProps({
  series: Array,
  labels: Array,
})
</script>
