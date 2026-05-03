<!-- assets/vue/components/base/BaseProgressBar.vue -->
<template>
  <div class="progress bg-secondary bg-opacity-25 rounded-pill" :style="wrapperStyle">
    <div
        class="progress-bar bg-primary rounded-pill"
        role="progressbar"
        :style="{ width: value + '%' }"
        :aria-valuenow="value"
        aria-valuemin="0"
        aria-valuemax="100"
    ></div>
  </div>
</template>

<script setup>
const props = defineProps({
  value: {
    type: Number,
    default: 0,
  },
  height: {
    type: String,
    default: "6px", // allows easy overrides: "4px", "10px", etc.
  },
})

const wrapperStyle = {
  height: props.height,
}
</script>
