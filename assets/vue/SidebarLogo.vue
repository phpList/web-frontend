<template>
  <RouterLink to="/" class="d-flex align-items-center text-decoration-none">
    <div class="d-flex align-items-center justify-content-center rounded mr-2" style="width:38px;height:38px;">
      <img
          class="w-100 h-100 img-fluid d-block"
          :src="logo"
          alt="Logo"
          style="object-fit: contain;"
      />
    </div>

    <div class="d-flex align-items-center fw-bold">
      <h3 class="fs-2 fw-bold mb-0 text-dark">
        phpList <span class="text-primary">4</span>
      </h3>
    </div>
  </RouterLink>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import logo from '../images/logo-48.png'
</script>
