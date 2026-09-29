<!-- assets/vue/components/base/BaseButton.vue -->
<template>
  <button
      :class="buttonClass"
      type="button"
      v-bind="$attrs"
  >
    <BaseIcon v-if="icon" :name="icon" class="w-3.5 h-3.5" inherit-color />
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'
import BaseIcon from './BaseIcon.vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary', // primary | secondary | ghost | accent
  },
  icon: {
    type: String,
    default: '',
  },
})

const buttonClass = computed(() => {
  const base = 'inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2';
  switch (props.variant) {
    case 'secondary':
      return `${base} text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 focus:ring-blue-500`;
    case 'ghost':
      return 'inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 dark:text-blue-400 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-500/10 focus:outline-none';
    case 'accent':
      return 'inline-flex shrink-0 items-center gap-2 whitespace-nowrap min-w-max px-4 py-2 border border-transparent text-xs font-bold rounded-lg shadow-sm bg-ext-wf1 text-white hover:bg-ext-wf3 shadow-indigo-500/20 transition-shadow disabled:opacity-60 focus:outline-none';
    case 'primary':
    default:
      return `${base} text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`;
  }
})
</script>

