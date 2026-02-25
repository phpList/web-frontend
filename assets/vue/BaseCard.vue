<template>
  <div class="card" :class="[`card--${variant}`]">
    <slot />
  </div>
</template>

<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: 'default', // default | subtle | danger | ...
  },
})
</script>
