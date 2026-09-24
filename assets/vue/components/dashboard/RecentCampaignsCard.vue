<!-- assets/vue/components/dashboard/RecentCampaignsCard.vue -->
<template>
  <BaseCard>
    <header class="mb-3">
      <h2 class="text-sm font-bold text-gray-900 mb-0 dark:text-slate-100">
        Recent Campaigns
      </h2>
    </header>

    <div
      v-if="loading"
      class="flex justify-center py-8"
    >
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>

    <div
      v-else-if="error"
      class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
      role="alert"
    >
      {{ error }}
    </div>

    <div v-else class="overflow-x-auto">
      <CampaignsTable :rows="rows" />
    </div>
  </BaseCard>
</template>

<script setup>
import BaseCard from '../../components/base/BaseCard.vue'
import CampaignsTable from './CampaignsTable.vue'

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})
</script>
