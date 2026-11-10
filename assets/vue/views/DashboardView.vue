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

      <!-- Quick actions -->
      <section class="mb-6">
        <QuickActionsCard />
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
  load,
} = useDashboardData()

onMounted(load)
</script>