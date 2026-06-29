<template>
  <AdminLayout>
    <div class="space-y-6 animate-in fade-in duration-300">
      <SettingsActionsPanel />
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '../layouts/AdminLayout.vue'
import SettingsActionsPanel from '../components/settings/SettingsActionsPanel.vue'
</script>
