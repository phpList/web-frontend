<template>
  <AdminLayout>
    <div class="space-y-6 animate-in fade-in duration-300">
      <ListDirectory />
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '../layouts/AdminLayout.vue'
import ListDirectory from '../components/lists/ListDirectory.vue'
</script>
