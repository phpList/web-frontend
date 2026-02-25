<!-- assets/vue/layouts/DashboardLayout.vue -->
<template>
  <div class="layout">
    <aside class="layout__sidebar">
      <slot name="sidebar"></slot>
    </aside>

    <div class="layout__content">
      <header class="layout__topbar">
        <slot name="topbar"></slot>
      </header>

      <main class="layout__main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
/* No imports required */
</script>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  height: 100vh;
}

.layout__sidebar {
  background: #fff;
  border-right: 1px solid #e5e7eb;
  padding: 1rem 0;
}

.layout__content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.layout__topbar {
  padding: 1rem 1.25rem;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

.layout__main {
  padding: 1.5rem 2rem;
  overflow-y: auto;
  background: #f8fafc;
}
</style>
