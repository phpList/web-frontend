<template>
  <div class="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 flex text-slate-900 dark:text-slate-100 font-sans">
    <AppSidebar />

    <div class="flex flex-col flex-1 min-h-screen min-w-0">
      <RouterView />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import AppSidebar from './components/sidebar/AppSidebar.vue'
import { useDarkMode } from './composables/useDarkMode'

const { initDarkMode } = useDarkMode()

onMounted(() => {
  initDarkMode()
})
</script>
