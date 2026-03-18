<template>
  <AdminLayout>
    <div class="space-y-6 animate-in fade-in duration-300">
      <SubscriberDirectory />
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '../layouts/AdminLayout.vue'
import SubscriberDirectory from '../components/subscribers/SubscriberDirectory.vue'
</script>
