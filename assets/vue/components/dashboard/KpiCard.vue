<!-- components/dashboard/KpiCard.vue -->
<template>
  <BaseCard>
    <header class="flex items-center mb-2">
      <div
        class="inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-500 mr-2"
        style="width: 40px; height: 40px;"
      >
        <BaseIcon :name="icon" />
      </div>
      <p class="mb-0 text-gray-500 uppercase text-xs font-semibold">{{ label }}</p>
    </header>

    <p class="mb-1 text-2xl font-bold">{{ value }}</p>

    <p class="mb-0 text-sm" :class="trendClass">
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

const trendClass = computed(() => (props.trend === 'down' ? 'text-red-600' : 'text-green-600'))
</script>
