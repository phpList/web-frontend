<!-- assets/vue/layouts/DashboardLayout.vue -->
<template>
  <div class="d-flex min-vh-100">
    <!-- Sidebar -->
    <aside
        class="bg-white border-end py-3"
        style="width: 260px;"
    >
      <slot name="sidebar"></slot>
    </aside>

    <!-- Content area -->
    <div class="d-flex flex-column flex-grow-1">
      <!-- Topbar -->
      <header class="bg-white border-bottom py-3 px-4">
        <slot name="topbar"></slot>
      </header>

      <!-- Main content -->
      <main class="flex-grow-1 overflow-auto py-4 px-5 bg-light">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
/* No imports required */
</script>
