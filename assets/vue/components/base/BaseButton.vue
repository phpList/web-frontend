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
  const base = 'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2';
  switch (props.variant) {
    case 'secondary':
      return `${base} text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-blue-500`;
    case 'ghost':
      return 'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-transparent hover:bg-blue-50 focus:outline-none';
    case 'primary':
    default:
      return `${base} text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`;
  }
})
</script>

