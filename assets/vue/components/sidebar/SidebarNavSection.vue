<template>
  <div class="mb-4">
    <p class="text-uppercase text-muted small px-3 mb-2">{{ label }}</p>

    <ul class="nav flex-column mb-2" role="navigation" :aria-label="label">
      <SidebarNavItem
          v-for="item in items"
          :key="item.label"
          :item="item"
      />
    </ul>
  </div>
</template>

<script setup>
import SidebarNavItem from './SidebarNavItem.vue'

const props = defineProps({
  label: String,
  items: { type: Array, default: () => [] },
})
</script>
