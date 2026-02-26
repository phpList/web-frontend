<!-- assets/vue/layouts/DashboardLayout.vue -->
<template>
  <div class="d-flex min-vh-100">
    <!-- Content area -->
    <div class="d-flex flex-column flex-grow-1">
      <!-- Topbar -->
      <header class="bg-white border-bottom py-3 px-4 sticky-top" style="z-index: 1030;">
        <slot name="topbar"></slot>
      </header>

      <!-- Main content -->
      <main class="flex-grow-1 py-4 px-5 bg-light">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
/* No imports required */
</script>
