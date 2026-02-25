<!-- assets/vue/components/base/BaseButton.vue -->
<template>
  <button
      :class="buttonClass"
      type="button"
      v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary', // primary | secondary | ghost
  },
})

const buttonClass = computed(() => {
  switch (props.variant) {
    case 'secondary':
      return 'btn btn-secondary';
    case 'ghost':
      return 'btn btn-link text-primary';
    case 'primary':
    default:
      return 'btn btn-primary';
  }
})
</script>

