<template>
  <AdminLayout>
    <div class="space-y-6 animate-in fade-in duration-300">
      <PublicPagesDirectory />
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '../layouts/AdminLayout.vue'
import PublicPagesDirectory from '../components/public-pages/PublicPagesDirectory.vue'
</script>
