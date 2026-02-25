<template>
  <DashboardLayout>
    <div class="dashboard">
      <KpiGrid class="dashboard__section" />

      <section class="dashboard__section dashboard__row">
        <PerformanceChartCard
            class="dashboard__col--2"
            :labels="chart.labels"
            :series="chart.series"
        />
        <SystemOverviewCard class="dashboard__col--1" />
      </section>

      <section class="dashboard__section">
        <RecentCampaignsCard />
      </section>
    </div>
  </DashboardLayout>
</template>

<script setup>
import DashboardLayout from './layouts/DashboardLayout.vue'
import KpiGrid from '/components/dashboard/KpiGrid.vue'
import PerformanceChartCard from './components/dashboard/PerformanceChartCard.vue'
import SystemOverviewCard from './components/dashboard/SystemOverviewCard.vue'
import RecentCampaignsCard from './components/dashboard/RecentCampaignsCard.vue'

const chart = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  series: [
    { name: 'Opens', data: [2500, 2200, 10000, 4000, 4500, 3800] },
    { name: 'Clicks', data: [4200, 3500, 3200, 3000, 3600, 4100] },
  ],
}
</script>
