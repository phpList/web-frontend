<!-- assets/vue/components/base/BaseProgressBar.vue -->
<template>
  <div class="progress">
    <div
        class="progress__fill"
        :style="{ width: value + '%' }"
    ></div>
  </div>
</template>

<script setup>
const props = defineProps({
  value: {
    type: Number,
    default: 0,
  },
})
</script>

<style scoped>
.progress {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.progress__fill {
  height: 100%;
  background: #4f46e5;
  border-radius: inherit;
  transition: width 0.2s ease-in-out;
}
</style>
