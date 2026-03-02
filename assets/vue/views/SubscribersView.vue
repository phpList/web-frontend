<template>
  <AdminLayout>
    <div class="space-y-6 animate-in fade-in duration-300">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <SubscriberDirectory />
        </div>
        <div class="space-y-6">
          <ActivitySidebar />
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '../layouts/AdminLayout.vue'
import SubscriberDirectory from '../components/subscribers/SubscriberDirectory.vue'
import ActivitySidebar from '../components/subscribers/ActivitySidebar.vue'
</script>
