<template>
  <RouterLink
      :to="item.route"
      custom
      v-slot="{ navigate, href, isActive }"
  >
    <a
        :href="href"
        @click="(e) => { navigate(e); closeSidebar(); }"
        class="w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors group no-underline"
        :class="isActive ? 'bg-white/15 text-white' : 'text-slate-100 hover:text-white hover:bg-slate-600 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'"
    >
      <div class="flex items-center gap-3">
        <BaseIcon
            :name="item.icon"
            inherit-color
        />

        <span class="font-medium text-sm">{{ item.label }}</span>
      </div>

      <BaseBadge
          v-if="item.badge != null"
          variant="counter"
          class="ml-auto"
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

const { closeSidebar } = useSidebar()

const props = defineProps({
  item: { type: Object, required: true },
})

const route = useRoute()
const isActive = computed(() => route.path === props.item.route)
</script>

