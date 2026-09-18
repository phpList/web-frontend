<!-- assets/vue/components/base/BaseBadge.vue -->
<template>
  <span :class="badgeClass">
    <slot />
  </span>
<!-- Renders a Tailwind badge; styling controlled via variant prop -->
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  variant: {
    type: String,
    default: 'neutral', // neutral | counter
  },
})

const badgeClass = computed(() => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';
  switch (props.variant) {
    case 'counter':
      return `${base} bg-indigo-50 dark:bg-indigo-500/10 text-ext-wf3 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20`;
    case 'neutral':
    default:
      return `${base} bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200`;
  }
})
</script>
