<template>
  <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      @click.self="handleBackdropClick"
  >
    <div :class="['w-full rounded-xl bg-white dark:bg-slate-800 shadow-xl max-h-[90vh] overflow-y-auto', maxWidthClass]">
      <div class="border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
        <slot name="title">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{{ title }}</h2>
        </slot>

        <button
            v-if="showClose"
            type="button"
            aria-label="Close"
            class="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <slot />

      <div
          v-if="$slots.footer"
          class="bg-slate-50 dark:bg-slate-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2 rounded-b-xl"
      >
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  title: { type: String, default: '' },
  maxWidth: { type: String, default: 'lg' }, // sm | md | lg | xl | 2xl
  showClose: { type: Boolean, default: true },
  closeOnBackdrop: { type: Boolean, default: true }
})

const emit = defineEmits(['close'])

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl'
}

const maxWidthClass = computed(() => maxWidthMap[props.maxWidth] || maxWidthMap.lg)

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    emit('close')
  }
}
</script>