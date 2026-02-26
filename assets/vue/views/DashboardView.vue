<template>
  <AdminLayout>
    <!-- Topbar slot -->

    <!-- Main content -->
    <div class="container-fluid">
      <!-- KPI Cards -->
      <KpiGrid />

      <!-- Chart + Overview -->
      <section class="row g-4 mb-4">
        <div class="col-12 col-lg-8">
          <PerformanceChartCard :labels="chart.labels" :series="chart.series" class="h-100" />
        </div>
      </section>

      <!-- Recent items list -->
      <section class="row g-4">
        <div class="col-12">
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
