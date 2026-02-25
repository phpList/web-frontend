<!-- components/dashboard/KpiCard.vue -->
<template>
  <BaseCard class="kpi-card">
    <header class="kpi-card__header">
      <div class="kpi-card__icon-wrap">
        <BaseIcon :name="icon" />
      </div>
      <p class="kpi-card__label">{{ label }}</p>
    </header>

    <p class="kpi-card__value">{{ value }}</p>

    <p class="kpi-card__change" :class="`kpi-card__change--${trend}`">
      {{ change }} vs last month
    </p>
  </BaseCard>
</template>

<script setup>
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
</script>
