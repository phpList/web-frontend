<template>
  <AdminLayout>
    <div class="space-y-6 animate-in fade-in duration-300">
      <CampaignDirectory />
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '../layouts/AdminLayout.vue'
import CampaignDirectory from '../components/campaigns/CampaignDirectory.vue'
</script>
