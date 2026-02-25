<template>
  <RouterLink to="/" class="d-flex align-items-center text-decoration-none px-4 py-3">
    <div class="d-flex align-items-center justify-content-center rounded mr-2" style="width:32px;height:32px;">
      <img
          class="w-100 h-100 img-fluid d-block"
          :src="logo"
          alt="Logo"
          style="object-fit: contain;"
      />
    </div>

    <div class="d-flex align-items-center">
      <div class="h6 mb-0 fw-bold text-dark">{{ name }}</div>
      <div v-if="version" class="h6 mb-0 fw-bold text-primary">{{ version }}</div>
    </div>
  </RouterLink>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import logo from '../images/logo-48.png'

const props = defineProps({
  name: {
    type: String,
    default: 'phpList',
  },
  version: {
    type: String,
    default: '4',
  },
})
</script>
