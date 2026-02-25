<template>
  <div class="sidebar-section">
    <p class="sidebar-section__label">{{ label }}</p>

    <ul class="sidebar-section__list">
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
