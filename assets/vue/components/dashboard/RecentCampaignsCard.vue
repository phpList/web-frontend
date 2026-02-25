<!-- assets/vue/components/dashboard/RecentCampaignsCard.vue -->
<template>
  <BaseCard>
    <header class="rc-header">
      <h2>Recent Campaigns</h2>
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

<style scoped>
.rc-header h2 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 1rem;
}
</style>
