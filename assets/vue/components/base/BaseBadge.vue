<!-- assets/vue/components/base/BaseBadge.vue -->
<template>
  <span class="base-badge" :class="`base-badge--${variant}`">
    <slot />
  </span>
</template>

<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: 'neutral', // "neutral" | "counter" | etc.
  },
})
</script>

<style scoped>
.base-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.base-badge--neutral {
  background: #e5e7eb;
  color: #374151;
}

.base-badge--counter {
  background: #eef2ff;
  color: #4f46e5;
}
</style>
