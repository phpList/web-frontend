<template>
  <RouterLink
      :to="item.route"
      custom
      v-slot="{ navigate, href, isActive }"
  >
    <a
        :href="href"
        @click="(e) => { navigate(e); closeSidebar(); }"
        :title="isSidebarCollapsed ? item.label : undefined"
        class="w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors group no-underline"
        :class="[isSidebarCollapsed ? 'lg:justify-center lg:px-0' : '', isActive ? 'bg-white/15 text-white' : 'text-slate-100 hover:text-white hover:bg-slate-600 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800']"
    >
      <div class="flex items-center gap-3">
        <BaseIcon
            :name="item.icon"
            inherit-color
        />

        <span class="font-medium text-sm" :class="isSidebarCollapsed ? 'lg:hidden' : ''">{{ item.label }}</span>
      </div>

      <BaseBadge
          v-if="item.badge != null"
          variant="counter"
          class="ml-auto"
          :class="isSidebarCollapsed ? 'lg:hidden' : ''"
      >
        {{ item.badge }}
      </BaseBadge>
    </a>
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BaseIcon from '../base/BaseIcon.vue'
import BaseBadge from '../base/BaseBadge.vue'
import { useSidebar } from '../../composables/useSidebar'

const { closeSidebar, isSidebarCollapsed } = useSidebar()

const props = defineProps({
  item: { type: Object, required: true },
})

const route = useRoute()
const isActive = computed(() => route.path === props.item.route)
</script>

