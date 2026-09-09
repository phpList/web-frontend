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
import { onMounted } from 'vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import KpiGrid from '../components/dashboard/KpiGrid.vue'
import PerformanceChartCard from '../components/dashboard/PerformanceChartCard.vue'
import QuickActionsCard from '../components/dashboard/QuickActionsCard.vue'
import RecentCampaignsCard from '../components/dashboard/RecentCampaignsCard.vue'
import { useDashboardData } from '../composables/useDashboardData'

const { summary, recentCampaigns, chart, error: dashboardError, load } = useDashboardData()

onMounted(load)
</script>