<template>
  <AdminLayout>
    <!-- Topbar slot -->

    <!-- Main content -->
    <div class="w-full">
      <div
        v-if="dashboardError"
        class="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        role="alert"
      >
        {{ dashboardError }}
      </div>

      <!-- KPI Cards -->
      <KpiGrid />

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
import AdminLayout from '../layouts/AdminLayout.vue'
import KpiGrid from '../components/dashboard/KpiGrid.vue'
import PerformanceChartCard from '../components/dashboard/PerformanceChartCard.vue'
import QuickActionsCard from '../components/dashboard/QuickActionsCard.vue'
import RecentCampaignsCard from '../components/dashboard/RecentCampaignsCard.vue'

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
const dashboardError = appElement?.dataset.dashboardError || ''

const chart = dashboardStats.chart || {
  labels: [],
  series: [
    { name: 'Opens', data: [] },
    { name: 'Clicks', data: [] },
  ],
}

const recentCampaigns = dashboardStats.recent_campaigns || []
</script>
