<template>
  <DashboardLayout>
    <!-- Sidebar slot -->
    <template #sidebar>
      <div class="px-3">
        <div class="d-flex align-items-center gap-2 px-2 mb-3">
          <BaseIcon name="dashboard" />
          <span class="fw-semibold">Admin</span>
        </div>

        <nav class="nav nav-pills flex-column gap-1">
          <RouterLink to="/dashboard" class="nav-link d-flex align-items-center gap-2">
            <BaseIcon name="dashboard" />
            <span>Dashboard</span>
          </RouterLink>
          <RouterLink to="/campaigns" class="nav-link d-flex align-items-center gap-2">
            <BaseIcon name="send" />
            <span>Campaigns</span>
          </RouterLink>
          <RouterLink to="/subscribers" class="nav-link d-flex align-items-center gap-2">
            <BaseIcon name="users" />
            <span>Subscribers</span>
          </RouterLink>
          <RouterLink to="/settings" class="nav-link d-flex align-items-center gap-2">
            <BaseIcon name="settings" />
            <span>Settings</span>
          </RouterLink>
        </nav>
      </div>
    </template>

    <!-- Topbar slot -->
    <template #topbar>
      <div class="d-flex align-items-center gap-3">
        <form class="flex-grow-1" role="search" @submit.prevent>
          <div class="input-group">
            <span class="input-group-text bg-white border-end-0"><BaseIcon name="search" /></span>
            <input type="search" class="form-control border-start-0" placeholder="Search..." />
          </div>
        </form>
        <div class="d-flex align-items-center gap-3">
          <button class="btn btn-sm btn-outline-secondary">Help</button>
          <div class="d-flex align-items-center gap-2">
            <BaseIcon name="user" />
            <span class="small">Admin</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Main content -->
    <div class="container-fluid">
      <!-- KPI Cards -->
      <KpiGrid />

      <!-- Chart + Overview -->
      <section class="row g-4 mb-4">
        <div class="col-12 col-lg-8">
          <PerformanceChartCard :labels="chart.labels" :series="chart.series" class="h-100" />
        </div>
        <div class="col-12 col-lg-4">
          <SystemOverviewCard class="h-100" />
        </div>
      </section>

      <!-- Recent items list -->
      <section class="row g-4">
        <div class="col-12">
          <RecentCampaignsCard />
        </div>
      </section>
    </div>
  </DashboardLayout>
</template>

<script setup>
import DashboardLayout from './layouts/DashboardLayout.vue'
import KpiGrid from './components/dashboard/KpiGrid.vue'
import PerformanceChartCard from './components/dashboard/PerformanceChartCard.vue'
import SystemOverviewCard from './components/dashboard/SystemOverviewCard.vue'
import RecentCampaignsCard from './components/dashboard/RecentCampaignsCard.vue'
import BaseIcon from './components/base/BaseIcon.vue'

const chart = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  series: [
    { name: 'Opens', data: [2500, 2200, 10000, 4000, 4500, 3800] },
    { name: 'Clicks', data: [4200, 3500, 3200, 3000, 3600, 4100] },
  ],
}
</script>
