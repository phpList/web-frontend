<!-- assets/vue/components/dashboard/PerformanceChartCard.vue -->
<template>
  <BaseCard>
    <header class="mb-3 flex items-center justify-between">
      <h2 class="text-sm font-bold text-gray-900">
        Campaign Performance
      </h2>
      <p class="text-gray-500 text-xs mb-0">
        Daily opens and clicks for the last 30 days
      </p>
    </header>

    <div class="mt-3" style="height: 220px;">
      <apexchart
          type="area"
          height="220"
          :options="chartOptions"
          :series="series"
      />
    </div>
  </BaseCard>
</template>

<script setup>
import { computed } from 'vue'
import BaseCard from '../../components/base/BaseCard.vue'
import VueApexCharts from 'vue3-apexcharts'

defineOptions({
  components: {
    apexchart: VueApexCharts,
  },
})

const props = defineProps({
  chart: {
    type: Object,
    required: true,
    default: () => ({
      labels: [],
      series: [],
    }),
  },
})

const series = computed(() => props.chart?.series ?? [])

const chartOptions = computed(() => ({
  chart: {
    type: 'area',
    toolbar: { show: false },
    zoom: { enabled: false },
    sparkline: { enabled: false },
    fontFamily: 'inherit',
  },
  stroke: {
    curve: 'smooth',
    width: 2,
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.18,
      opacityTo: 0.03,
      stops: [0, 100],
    },
  },
  colors: ['#10b981', '#3b82f6'],
  dataLabels: {
    enabled: false,
  },
  grid: {
    borderColor: '#e5e7eb',
    strokeDashArray: 4,
    padding: {
      left: 8,
      right: 8,
      top: 0,
      bottom: 0,
    },
  },
  legend: {
    show: true,
    position: 'top',
    horizontalAlign: 'right',
    fontSize: '12px',
    markers: {
      width: 8,
      height: 8,
      radius: 99,
    },
  },
  xaxis: {
    categories: props.chart?.labels ?? [],
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: {
      style: {
        colors: '#9ca3af',
        fontSize: '12px',
      },
    },
  },
  yaxis: {
    labels: {
      style: {
        colors: '#9ca3af',
        fontSize: '12px',
      },
      formatter: (value) => Math.round(value).toLocaleString(),
    },
  },
  tooltip: {
    shared: true,
    intersect: false,
    y: {
      formatter: (value) => value.toLocaleString(),
    },
  },
  markers: {
    size: 0,
    hover: {
      size: 4,
    },
  },
}))
</script>
