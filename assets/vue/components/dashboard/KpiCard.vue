<!-- components/dashboard/KpiCard.vue -->
<template>
  <BaseCard>
    <header class="d-flex align-items-center mb-2">
      <div
        class="d-inline-flex align-items-center justify-content-center rounded-circle bg-light text-secondary me-2"
        style="width: 40px; height: 40px;"
      >
        <BaseIcon :name="icon" />
      </div>
      <p class="mb-0 text-muted text-uppercase small fw-semibold">{{ label }}</p>
    </header>

    <p class="mb-1 fs-3 fw-bold">{{ value }}</p>

    <p class="mb-0 small" :class="trendClass">
      {{ change }} vs last month
    </p>
  </BaseCard>
</template>

<script setup>
import { computed } from 'vue'
import BaseCard from '../../components/base/BaseCard.vue'
import BaseIcon from '../../components/base/BaseIcon.vue'

const props = defineProps({
  label: String,
  value: [String, Number],
  change: String,         // "+12.5%" etc.
  trend: {                // "up" | "down"
    type: String,
    default: 'up',
  },
  icon: String,
})

const trendClass = computed(() => (props.trend === 'down' ? 'text-danger' : 'text-success'))
</script>
