<!-- assets/vue/components/charts/LineChart.vue -->
<template>
  <div class="linechart">
    <svg
        class="linechart__svg"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
    >
      <!-- grid lines -->
      <line
          v-for="y in 4"
          :key="'grid-' + y"
          :x1="0"
          :x2="100"
          :y1="(y * 10)"
          :y2="(y * 10)"
          class="linechart__grid-line"
      />

      <!-- series polylines -->
      <polyline
          v-for="(path, idx) in paths"
          :key="'series-' + idx"
          :points="path"
          class="linechart__line"
          :class="'linechart__line--' + idx"
          fill="none"
      />
    </svg>

    <div class="linechart__labels">
      <span
          v-for="(label, idx) in labels"
          :key="'label-' + idx"
          class="linechart__label"
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
})

const paths = computed(() => {
  if (!props.series.length || !props.labels.length) return []

  const pointCount = props.labels.length
  const allValues = props.series.flatMap((s) => s.data)
  const max = Math.max(...allValues)
  const min = Math.min(...allValues)
  const range = max === min ? 1 : max - min

  return props.series.map((s) => {
    return s.data.map((value, index) => {
      const x =
          pointCount === 1 ? 50 : (index / (pointCount - 1)) * 100
      const normalized = (value - min) / range
      const y = 35 - normalized * 25 // padding top/bottom
      return `${x},${y}`
    }).join(' ')
  })
})
</script>

<style scoped>
.linechart {
  width: 100%;
}

.linechart__svg {
  width: 100%;
  height: 210px;
}

.linechart__grid-line {
  stroke: #e5e7eb;
  stroke-width: 0.3;
}

.linechart__line {
  stroke-width: 1.8;
}

/* two simple colors for the first two series */
.linechart__line--0 {
  stroke: #4f46e5;
}
.linechart__line--1 {
  stroke: #f97316;
}

.linechart__labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.linechart__label {
  min-width: 0;
}
</style>
