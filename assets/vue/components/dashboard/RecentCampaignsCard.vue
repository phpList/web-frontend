<!-- assets/vue/components/dashboard/RecentCampaignsCard.vue -->
<template>
  <BaseCard>
    <header class="mb-3">
      <h2 class="text-sm font-bold text-gray-900 mb-0">
        Recent Campaigns
      </h2>
    </header>

    <div class="overflow-x-auto">
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
})
</script>
