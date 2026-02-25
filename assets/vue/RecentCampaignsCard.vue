<!-- RecentCampaignsCard.vue -->
<template>
  <BaseCard>
    <header class="card-header">
      <h2>Recent Campaigns</h2>
    </header>

    <CampaignsTable :rows="rows" />
  </BaseCard>
</template>

<script setup>
import BaseCard from './components/base/BaseCard.vue'
import CampaignsTable from './CampaignsTable.vue'

const rows = [
  {
    id: 1,
    name: 'Monthly Newsletter - June',
    status: 'Sent',
    date: '2024-06-01',
    openRate: '24.5%',
    clickRate: '3.2%',
  },
  // ...
]
</script>
