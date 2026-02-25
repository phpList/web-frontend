<!-- assets/vue/components/dashboard/SystemOverviewCard.vue -->
<template>
  <BaseCard>
    <!-- Title -->
    <h2 class="h6 fw-bold text-dark mb-3">
      System Overview
    </h2>

    <!-- Queue section -->
    <div class="mb-4">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span>Queue Status</span>
        <BaseBadge variant="counter">Healthy</BaseBadge>
      </div>

      <!-- Progress -->
      <div
          class="bg-secondary bg-opacity-25 rounded-pill overflow-hidden"
          style="height: 6px;"
      >
        <div
            class="bg-primary rounded-pill"
            :style="{ width: queuePercent + '%' , height: '100%' }"
        ></div>
      </div>

      <p class="text-secondary small mt-2 mb-0">
        {{ remaining.toLocaleString() }} emails remaining in queue
      </p>
    </div>

    <!-- Metadata -->
    <div class="small text-secondary d-grid gap-1">
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
