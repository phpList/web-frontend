<!-- assets/vue/components/dashboard/PerformanceChartCard.vue -->
<template>
  <BaseCard>
    <header class="mb-3">
      <h2 class="h6 fw-bold text-dark mb-1">
        Campaign Performance
      </h2>
      <p class="text-muted small mb-0">
        Daily opens and clicks for the last 30 days
      </p>
    </header>

    <div
        class="d-flex align-items-center justify-content-center mt-3 rounded-3 bg-light text-secondary small"
        style="height: 220px;"
    >
      <span>Chart Placeholder</span>
    </div>
  </BaseCard>
</template>

<script setup>
import BaseCard from '../../components/base/BaseCard.vue'
</script>
