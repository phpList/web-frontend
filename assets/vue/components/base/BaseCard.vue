<template>
  <div class="base-card" :class="variantClass">
    <slot />
  </div>
</template>

<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: "default", // "default", "subtle", "danger", etc.
  },
});

const variantClass = `base-card--${props.variant}`;
</script>

<style scoped>
.base-card {
  background: #ffffff;
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

/* optional light variants */
.base-card--subtle {
  background: #f9fafb;
}
</style>
