<template>
  <AdminLayout>
    <!-- Topbar slot -->

    <!-- Main content -->
    <div class="w-full">
      <!-- KPI Cards -->
      <KpiGrid />

      <!-- Chart + Overview -->
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div class="lg:col-span-8">
          <PerformanceChartCard :labels="chart.labels" :series="chart.series" class="h-full" />
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

const chart = dashboardStats.chart || {
  labels: [],
  series: [
    { name: 'Opens', data: [] },
    { name: 'Clicks', data: [] },
  ],
}

const recentCampaigns = dashboardStats.recent_campaigns || []
</script>
