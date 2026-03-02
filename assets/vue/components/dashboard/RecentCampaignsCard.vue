<!-- assets/vue/components/dashboard/RecentCampaignsCard.vue -->
<template>
  <BaseCard>
    <header class="mb-3">
      <h2 class="text-sm font-bold text-gray-900 mb-0">
        Recent Campaigns
      </h2>
    </header>

    <CampaignsTable :rows="rows" />
  </BaseCard>
</template>

<script setup>
import BaseCard from '../../components/base/BaseCard.vue'
import CampaignsTable from './CampaignsTable.vue'

const props = defineProps({
  // todo: take from backend
  rows: {
    type: Array,
    default: () => [
      {
        id: 'campaign-1',
        name: 'Summer Sale',
        status: 'Sent',
        date: '2023-07-01',
        openRate: '15%',
        clickRate: '5%',
      },
      {
        id: 'campaign-2',
        name: 'Winter Sale',
        status: 'scheduled',
        date: '2023-07-01',
        openRate: '23%',
        clickRate: '0%',
      },
      {
        id: 'campaign-3',
        name: 'Autumn Sale',
        status: 'draft',
        date: '2023-07-01',
        openRate: '11%',
        clickRate: '0%',
      },
    ],
  },
})
</script>
