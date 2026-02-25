<!-- assets/vue/components/dashboard/SystemOverviewCard.vue -->
<template>
  <BaseCard>
    <h2 class="sys-title">System Overview</h2>

    <div class="sys-section">
      <div class="sys-row">
        <span>Queue Status</span>
        <BaseBadge variant="counter">Healthy</BaseBadge>
      </div>

      <div class="sys-progress">
        <div class="sys-progress-fill" :style="{ width: queuePercent + '%' }"></div>
      </div>

      <p class="sys-remaining">
        {{ remaining.toLocaleString() }} emails remaining in queue
      </p>
    </div>

    <div class="sys-meta">
      <div><strong>Last Cron Run:</strong> 2 mins ago</div>
      <div><strong>PHP Version:</strong> 8.2.14</div>
      <div><strong>Database Size:</strong> 256 MB</div>
    </div>
  </BaseCard>
</template>

<script setup>
import BaseCard from '../../components/base/BaseCard.vue'
import BaseBadge from '../../components/base/BaseBadge.vue'

const props = defineProps({
  queuePercent: { type: Number, default: 60 },
  remaining: { type: Number, default: 45102 },
})
</script>

<style scoped>
.sys-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 1rem;
}

.sys-section {
  margin-bottom: 1.5rem;
}

.sys-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.sys-progress {
  height: 6px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.sys-progress-fill {
  height: 100%;
  background: #4f46e5;
}

.sys-remaining {
  margin-top: 0.5rem;
  color: #475569;
  font-size: 0.85rem;
}

.sys-meta {
  font-size: 0.85rem;
  color: #475569;
  display: grid;
  gap: 0.4rem;
}
</style>
