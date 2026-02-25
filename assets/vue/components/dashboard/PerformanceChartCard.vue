<!-- assets/vue/components/dashboard/PerformanceChartCard.vue -->
<template>
  <BaseCard>
    <header class="pc-header">
      <h2>Campaign Performance</h2>
      <p class="pc-subtitle">Daily opens and clicks for the last 30 days</p>
    </header>

    <div class="pc-chart-placeholder">
      <span>Chart Placeholder</span>
    </div>
  </BaseCard>
</template>

<script setup>
import BaseCard from '../../components/base/BaseCard.vue'
</script>

<style scoped>
.pc-header h2 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.pc-subtitle {
  margin-top: 0.3rem;
  color: #64748b;
  font-size: 0.85rem;
}

.pc-chart-placeholder {
  margin-top: 1.2rem;
  height: 220px;
  border-radius: 0.75rem;
  background: repeating-linear-gradient(
      -45deg,
      #e2e8f0 0,
      #e2e8f0 10px,
      #f8fafc 10px,
      #f8fafc 20px
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 0.85rem;
}
</style>
