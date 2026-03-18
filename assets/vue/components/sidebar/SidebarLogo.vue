<template>
  <RouterLink to="/" class="flex items-center gap-2 no-underline">
    <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
      <img
          class="w-full h-full max-w-full h-auto block"
          :src="logo"
          alt="Logo"
          style="object-fit: contain;"
      />
    </div>
    <span class="font-bold text-lg tracking-tight text-slate-900">phpList <span class="text-ext-wf1">4</span></span>
  </RouterLink>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import logo from '../../../images/logo-48.png'
</script>
