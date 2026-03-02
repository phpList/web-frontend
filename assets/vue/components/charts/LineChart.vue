<!-- assets/vue/components/charts/LineChart.vue -->
<template>
  <div class="w-full">
    <svg
        class="w-full"
        :style="{ height }"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
    >
      <!-- grid lines -->
      <line
          v-for="y in 4"
          :key="'grid-' + y"
          :x1="0"
          :x2="100"
          :y1="y * 10"
          :y2="y * 10"
          stroke="#e5e7eb"
          stroke-width="0.3"
      />

      <!-- series polylines -->
      <polyline
          v-for="(path, idx) in paths"
          :key="'series-' + idx"
          :points="path"
          fill="none"
          stroke-width="1.8"
          :stroke="seriesColors[idx % seriesColors.length]"
      />
    </svg>

    <div class="flex justify-between mt-2 text-xs text-gray-500">
      <span
          v-for="(label, idx) in labels"
          :key="'label-' + idx"
          class="flex-1 truncate text-center"
      >
        {{ label }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  labels: {
    type: Array,
    default: () => [],
  },
  // series: [{ name: string, data: number[] }]
  series: {
    type: Array,
    default: () => [],
  },
  // control rendered SVG height (Tailwind handles width)
  height: {
    type: String,
    default: '210px',
  },
  // optional custom colors for series
  colors: {
    type: Array,
    default: () => [
      '#2563eb', // blue-600
      '#16a34a', // green-600
      '#dc2626', // red-600
      '#0891b2', // cyan-600
    ],
  },
})

const seriesColors = computed(() => props.colors)

const paths = computed(() => {
  if (!props.series.length || !props.labels.length) return []

  const pointCount = props.labels.length
  const allValues = props.series.flatMap((s) => s.data)
  const max = Math.max(...allValues)
  const min = Math.min(...allValues)
  const range = max === min ? 1 : max - min

  return props.series.map((s) => {
    return s.data
        .map((value, index) => {
          const x = pointCount === 1 ? 50 : (index / (pointCount - 1)) * 100
          const normalized = (value - min) / range
          const y = 35 - normalized * 25 // padding top/bottom
          return `${x},${y}`
        })
        .join(' ')
  })
})
</script>
