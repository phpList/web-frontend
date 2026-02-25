<!-- assets/vue/components/dashboard/RecentCampaignsCard.vue -->
<template>
  <BaseCard>
    <header class="mb-3">
      <h2 class="h6 fw-bold text-dark mb-0">
        Recent Campaigns
      </h2>
    </header>

    <CampaignsTable :rows="rows" />
  </BaseCard>
</template>

<script setup>
import BaseCard from '../../components/base/BaseCard.vue'
import CampaignsTable from '../../CampaignsTable.vue'

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
})
</script>
