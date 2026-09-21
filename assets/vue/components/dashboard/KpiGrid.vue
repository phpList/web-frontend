<template>
  <div
    v-if="loading"
    class="flex justify-center py-8 mb-8"
  >
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
  </div>

  <div
    v-else-if="error"
    class="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
    role="alert"
  >
    {{ error }}
  </div>

  <section
    v-else
    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
  >
    <div
      v-for="kpi in kpis"
      :key="kpi.id"
    >
      <KpiCard v-bind="kpi" class="h-full" />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import KpiCard from './KpiCard.vue'

const props = defineProps({
  summary: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})

const formatNumber = (value) => new Intl.NumberFormat().format(Number(value) || 0)

const formatPercentage = (value) => `${Number(value) || 0}%`

const formatChange = (value) => {
  const numericValue = Number(value) || 0
  const sign = numericValue > 0 ? '+' : ''
  return `${sign}${numericValue.toFixed(1)}%`
}

const toTrend = (value) => ((Number(value) || 0) < 0 ? 'down' : 'up')

const kpis = computed(() => [
  {
    id: 'subscribers',
    label: 'Total Subscribers',
    value: formatNumber(props.summary?.totalSubscribers?.value),
    change: formatChange(props.summary?.totalSubscribers?.changeVsLastMonth),
    trend: toTrend(props.summary?.totalSubscribers?.changeVsLastMonth),
    icon: 'users',
  },
  {
    id: 'campaigns',
    label: 'Active Campaigns',
    value: formatNumber(props.summary?.activeCampaigns?.value),
    change: formatChange(props.summary?.activeCampaigns?.changeVsLastMonth),
    trend: toTrend(props.summary?.activeCampaigns?.changeVsLastMonth),
    icon: 'plane',
  },
  {
    id: 'open-rate',
    label: 'Open Rate',
    value: formatPercentage(props.summary?.openRate?.value),
    change: formatChange(props.summary?.openRate?.changeVsLastMonth),
    trend: toTrend(props.summary?.openRate?.changeVsLastMonth),
    icon: 'rate',
  },
  {
    id: 'bounce-rate',
    label: 'Bounce Rate',
    value: formatPercentage(props.summary?.bounceRate?.value),
    change: formatChange(props.summary?.bounceRate?.changeVsLastMonth),
    trend: toTrend(props.summary?.bounceRate?.changeVsLastMonth),
    icon: 'warning',
  },
])
</script>
