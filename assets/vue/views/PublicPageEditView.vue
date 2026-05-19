<template>
  <AdminLayout>
    <div class="space-y-6 animate-in fade-in duration-300">
      <PublicPageEditor />
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '../layouts/AdminLayout.vue'
import PublicPageEditor from '../components/public-pages/PublicPageEditor.vue'
</script>
