<template>
  <DashboardLayout>
    <!-- Topbar slot -->
    <template #topbar>
      <div class="d-flex align-items-center gap-3">
        <!-- Search -->
        <form class="flex-grow-1" role="search" @submit.prevent>
          <div class="input-group">
            <span class="input-group-text bg-white border-end-0">
              <BaseIcon name="search" />
            </span>
            <input
                type="search"
                class="form-control border-start-0"
                placeholder="Search subscribers, campaigns..."
            />
          </div>
        </form>

        <div class="d-flex gap-3 ms-auto">
          <!-- Create Campaign button -->
          <button type="button" class="btn btn-primary d-flex align-items-center  mx-4">
            <span class="me-2 mr-2">+</span>
            <span>Create Campaign</span>
          </button>

          <!-- Notifications -->
          <button
              type="button"
              class="btn position-relative p-0 border-0 bg-transparent d-flex align-items-center  mx-4"
          >
            <BaseIcon name="notification" />
            <span
                class="position-absolute top-0 start-100 translate-middle p-0 bg-danger border border-light"
            >
          </span>
          </button>
          <!-- User dropdown -->
          <div class="dropdown">
            <button
                class="btn d-flex align-items-center"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
            >
              <div class="text-end lh-sm mx-2">
                <div class="fw-semibold small">Admin User</div>
              </div>

              <img
                  :src="avatar"
                  alt="Admin User"
                  class="rounded-circle"
                  width="24"
                  height="24"
              />

              <BaseIcon name="chevron-down" />
            </button>

            <ul class="dropdown-menu dropdown-menu-end">
              <li><button class="dropdown-item" type="button">Profile</button></li>
              <li><button class="dropdown-item" type="button">Settings</button></li>
              <li><hr class="dropdown-divider" /></li>
              <li><button class="dropdown-item" type="button">Logout</button></li>
            </ul>
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
import avatar from '@images/avatar.jpg'

const chart = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  series: [
    { name: 'Opens', data: [2500, 2200, 10000, 4000, 4500, 3800] },
    { name: 'Clicks', data: [4200, 3500, 3200, 3000, 3600, 4100] },
  ],
}
</script>
