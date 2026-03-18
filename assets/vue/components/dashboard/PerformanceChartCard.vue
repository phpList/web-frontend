<!-- assets/vue/components/dashboard/PerformanceChartCard.vue -->
<template>
  <BaseCard>
    <header class="mb-3">
      <h2 class="text-sm font-bold text-gray-900 mb-1">
        Campaign Performance
      </h2>
      <p class="text-gray-500 text-xs mb-0">
        Daily opens and clicks for the last 30 days
      </p>
    </header>

    <div
        class="flex items-center justify-center mt-3 rounded-lg bg-gray-100 text-gray-500 text-sm"
        style="height: 220px;"
    >
      <span>Chart Placeholder</span>
    </div>
  </BaseCard>
</template>

<script setup>
import BaseCard from '../../components/base/BaseCard.vue'
</script>
