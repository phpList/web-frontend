<!-- assets/vue/components/base/BaseBadge.vue -->
<template>
  <span :class="badgeClass">
    <slot />
  </span>
<!-- Renders a Bootstrap badge; styling controlled via variant prop -->
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
  switch (props.variant) {
    case 'counter':
      return 'badge badge-primary';
    case 'neutral':
    default:
      return 'badge badge-secondary';
  }
})
</script>
