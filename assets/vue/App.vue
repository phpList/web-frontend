<template>
  <div class="min-h-screen bg-[#F8FAFC] flex text-slate-900 font-sans">
    <AppSidebar />

    <div class="flex flex-col flex-1 min-h-screen">
      <RouterView />
    </div>
  </div>
</template>

<script setup>
import AppSidebar from './components/sidebar/AppSidebar.vue'
</script>
