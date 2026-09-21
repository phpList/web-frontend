<template>
  <AdminLayout>
    <!-- Topbar slot -->

    <!-- Main content -->
    <div class="w-full">
      <!-- KPI Cards -->
      <KpiGrid
        :summary="summary"
        :loading="summaryLoading"
        :error="summaryError"
      />

      <!-- Chart + Overview -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div class="w-full lg:col-span-2">
          <PerformanceChartCard
            :chart="chart"
            :loading="chartLoading"
            :error="chartError"
            class="h-full"
          />
        </div>
        <div class="w-full lg:col-span-1">
          <QuickActionsCard class="h-full" />
        </div>
      </section>

      <!-- Recent items list -->
      <section class="grid grid-cols-1 gap-6">
        <div class="w-full">
          <RecentCampaignsCard
            :rows="recentCampaigns"
            :loading="recentCampaignsLoading"
            :error="recentCampaignsError"
          />
        </div>
      </section>
    </div>
  </AdminLayout>
</template>

<script setup>
import { onMounted } from 'vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import KpiGrid from '../components/dashboard/KpiGrid.vue'
import PerformanceChartCard from '../components/dashboard/PerformanceChartCard.vue'
import QuickActionsCard from '../components/dashboard/QuickActionsCard.vue'
import RecentCampaignsCard from '../components/dashboard/RecentCampaignsCard.vue'
import { useDashboardData } from '../composables/useDashboardData'

const {
  summary,
  summaryLoading,
  summaryError,
  recentCampaigns,
  recentCampaignsLoading,
  recentCampaignsError,
  chart,
  chartLoading,
  chartError,
  load,
} = useDashboardData()

onMounted(load)
</script>