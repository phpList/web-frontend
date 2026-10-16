<template>
  <p
    v-for="message in messages"
    :key="message"
    class="mt-1 text-xs text-red-600 dark:text-red-400"
  >
    {{ message }}
  </p>
</template>

<script setup>
defineProps({
  messages: {
    type: Array,
    default: () => []
  }
})
</script>