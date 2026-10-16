<!-- assets/vue/components/base/ActionButton.vue -->
<template>
  <button
      type="button"
      :class="buttonClass"
      v-bind="$attrs"
  >
    <BaseIcon v-if="icon" :name="icon" class="w-3.5 h-3.5" />
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue'
import BaseIcon from './BaseIcon.vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'neutral' // neutral | danger | success | info | warning
  },
  icon: {
    type: String,
    default: ''
  },
  block: {
    type: Boolean,
    default: false // centers content, for full-width mobile buttons
  }
})

const variantClassMap = {
  neutral: 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700',
  danger: 'border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10',
  success: 'border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
  info: 'border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10',
  warning: 'border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10'
}

const buttonClass = computed(() => {
  const base = 'inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors disabled:opacity-60'
  const justify = props.block ? 'justify-center' : ''
  const variant = variantClassMap[props.variant] || variantClassMap.neutral

  return [base, justify, variant].filter(Boolean).join(' ')
})
</script>