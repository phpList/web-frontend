<template>
  <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

const appElement = document.getElementById('vue-app')

const parseDashboardStats = () => {
  const raw = appElement?.dataset.dashboardStats
  if (!raw) {
    return {}
  }

  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

const dashboardStats = parseDashboardStats()

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
    value: formatNumber(dashboardStats.total_subscribers?.value),
    change: formatChange(dashboardStats.total_subscribers?.change_vs_last_month),
    trend: toTrend(dashboardStats.total_subscribers?.change_vs_last_month),
    icon: 'users',
  },
  {
    id: 'campaigns',
    label: 'Active Campaigns',
    value: formatNumber(dashboardStats.active_campaigns?.value),
    change: formatChange(dashboardStats.active_campaigns?.change_vs_last_month),
    trend: toTrend(dashboardStats.active_campaigns?.change_vs_last_month),
    icon: 'plane',
  },
  {
    id: 'open-rate',
    label: 'Open Rate',
    value: formatPercentage(dashboardStats.open_rate?.value),
    change: formatChange(dashboardStats.open_rate?.change_vs_last_month),
    trend: toTrend(dashboardStats.open_rate?.change_vs_last_month),
    icon: 'rate',
  },
  {
    id: 'bounce-rate',
    label: 'Bounce Rate',
    value: formatPercentage(dashboardStats.bounce_rate?.value),
    change: formatChange(dashboardStats.bounce_rate?.change_vs_last_month),
    trend: toTrend(dashboardStats.bounce_rate?.change_vs_last_month),
    icon: 'warning',
  },
])
</script>
