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
      return `${base} bg-indigo-50 text-indigo-600 border border-indigo-100`;
    case 'neutral':
    default:
      return `${base} bg-gray-100 text-gray-800`;
  }
})
</script>
