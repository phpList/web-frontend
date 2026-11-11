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

      <!-- Quick actions + help -->
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <QuickActionsCard class="h-full" />
        <HelpCard class="h-full" />
      </section>

      <!-- Community news -->
      <section class="mb-6">
        <CommunityNewsCard
          :items="newsItems"
          :loading="newsLoading"
          :error="newsError"
        />
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
import HelpCard from '../components/dashboard/HelpCard.vue'
import CommunityNewsCard from '../components/dashboard/CommunityNewsCard.vue'
import { useDashboardData } from '../composables/useDashboardData'
import { useCommunityNews } from '../composables/useCommunityNews'

const {
  summary,
  summaryLoading,
  summaryError,
  recentCampaigns,
  recentCampaignsLoading,
  recentCampaignsError,
  load,
} = useDashboardData()

const {
  items: newsItems,
  loading: newsLoading,
  error: newsError,
  load: loadNews,
} = useCommunityNews()

onMounted(() => {
  load()
  loadNews()
})
</script>