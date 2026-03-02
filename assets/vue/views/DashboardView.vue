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
          <RecentCampaignsCard />
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
import BaseIcon from '../components/base/BaseIcon.vue'
import avatar from '@images/avatar.jpg'

const chart = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  series: [
    { name: 'Opens', data: [2500, 2200, 10000, 4000, 4500, 3800] },
    { name: 'Clicks', data: [4200, 3500, 3200, 3000, 3600, 4100] },
  ],
}
</script>
