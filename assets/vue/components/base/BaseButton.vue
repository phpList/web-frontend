<!-- assets/vue/components/base/BaseButton.vue -->
<template>
  <button
      class="base-button"
      :class="`base-button--${variant}`"
      type="button"
      v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
  },
})
</script>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;

  border: none;
  padding: 0.55rem 1.1rem;
  border-radius: 0.7rem;

  font-size: 0.9rem;
  font-weight: 600;

  cursor: pointer;
  transition: background 0.15s;
}

/* PRIMARY */
.base-button--primary {
  background: #4f46e5;
  color: #fff;
}
.base-button--primary:hover {
  background: #4338ca;
}

/* SECONDARY */
.base-button--secondary {
  background: #e2e8f0;
  color: #334155;
}
.base-button--secondary:hover {
  background: #cbd5e1;
}

/* GHOST (low emphasis) */
.base-button--ghost {
  background: transparent;
  color: #4f46e5;
}
.base-button--ghost:hover {
  background: rgba(79, 70, 229, 0.08);
}
</style>
