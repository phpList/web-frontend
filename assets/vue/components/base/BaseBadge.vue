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
    default: 'neutral', // neutral | counter | success | danger | info | warning | purple
  },
})

const badgeClass = computed(() => {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium';
  switch (props.variant) {
    case 'counter':
      return `${base} bg-indigo-50 dark:bg-indigo-500/10 text-ext-wf3 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20`;
    case 'success':
      return `${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400`;
    case 'danger':
      return `${base} bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400`;
    case 'info':
      return `${base} bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400`;
    case 'warning':
      return `${base} bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400`;
    case 'purple':
      return `${base} bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400`;
    case 'neutral':
    default:
      return `${base} bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200`;
  }
})
</script>
