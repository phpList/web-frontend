<template>
  <div class="d-flex" style="min-height: 100vh;">
    <AppSidebar />

    <main class="flex-grow-1">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import AppSidebar from './components/sidebar/AppSidebar.vue'
</script>
