<!-- components/dashboard/KpiCard.vue -->
<template>
  <BaseCard>
    <header class="flex items-center mb-2">
      <div
        class="inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-500 mr-2 dark:bg-slate-700 dark:text-slate-400"
        style="width: 40px; height: 40px;"
      >
        <BaseIcon :name="icon" />
      </div>
      <p class="mb-0 text-gray-500 uppercase text-xs font-semibold dark:text-slate-400">{{ label }}</p>
    </header>

    <p class="mb-1 text-2xl font-bold dark:text-slate-100">{{ value }}</p>

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
  id: String,
  label: String,
  value: [String, Number],
  change: String,         // "+12.5%" etc.
  trend: {                // "up" | "down"
    type: String,
    default: 'up',
  },
  icon: String,
})

const trendClass = computed(() => (props.trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'))
</script>
