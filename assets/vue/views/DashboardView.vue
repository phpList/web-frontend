<template>
  <AdminLayout>
    <!-- Topbar slot -->

    <!-- Main content -->
    <div class="w-full">
      <div
        v-if="dashboardError"
        class="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
        role="alert"
      >
        {{ dashboardError }}
      </div>

      <!-- KPI Cards -->
      <KpiGrid :summary="summary" />

      <!-- Chart + Overview -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div class="w-full lg:col-span-2">
          <PerformanceChartCard :chart="chart" class="h-full" />
        </div>
        <div class="w-full lg:col-span-1">
          <QuickActionsCard class="h-full" />
        </div>
      </section>

      <!-- Recent items list -->
      <section class="grid grid-cols-1 gap-6">
        <div class="w-full">
          <RecentCampaignsCard :rows="recentCampaigns" />
        </div>
      </section>
    </div>
  </AdminLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import KpiGrid from '../components/dashboard/KpiGrid.vue'
import PerformanceChartCard from '../components/dashboard/PerformanceChartCard.vue'
import QuickActionsCard from '../components/dashboard/QuickActionsCard.vue'
import RecentCampaignsCard from '../components/dashboard/RecentCampaignsCard.vue'
import { statisticsClient } from '../api'

const dashboardError = ref('')
const summary = ref(null)
const recentCampaigns = ref([])
const chart = ref({
  labels: [],
  series: [
    { name: 'Opens', data: [] },
    { name: 'Clicks', data: [] },
  ],
})

const formatChartLabel = (dateValue) => {
  if (!dateValue) {
    return ''
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ? new Date(...dateValue.split('-').map((part, index) => (index === 1 ? Number(part) - 1 : Number(part))))
    : new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(date)
}

const loadDashboard = async () => {
  dashboardError.value = ''

  try {
    const [summaryResponse, recentCampaignsResponse, performanceResponse] = await Promise.all([
      statisticsClient.getDashboardSummary(),
      statisticsClient.getRecentCampaigns(),
      statisticsClient.getCampaignPerformance(),
    ])

    summary.value = summaryResponse
    recentCampaigns.value = recentCampaignsResponse?.campaigns ?? []

    const points = performanceResponse?.points ?? []
    chart.value = {
      labels: points.map((point) => formatChartLabel(point.date)),
      series: [
        { name: 'Opens', data: points.map((point) => point.opens) },
        { name: 'Clicks', data: points.map((point) => point.clicks) },
      ],
    }
  } catch (error) {
    dashboardError.value = 'Unable to load dashboard statistics.'
    console.error('Failed to load dashboard statistics:', error)
  }
}

onMounted(loadDashboard)
</script>
