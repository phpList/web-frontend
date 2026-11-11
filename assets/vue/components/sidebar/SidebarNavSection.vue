<template>
  <div class="space-y-1">
    <p
        class="px-4 mt-8 mb-2 text-[10px] font-bold text-slate-300 dark:text-slate-400 uppercase tracking-widest first:mt-0"
        :class="isSidebarCollapsed ? 'lg:hidden' : ''"
    >{{ label }}</p>

    <SidebarNavItem
        v-for="item in items"
        :key="item.label"
        :item="item"
    />
  </div>
</template>

<script setup>
import SidebarNavItem from './SidebarNavItem.vue'
import { useSidebar } from '../../composables/useSidebar'

const { isSidebarCollapsed } = useSidebar()

const props = defineProps({
  label: String,
  items: { type: Array, default: () => [] },
})
</script>
