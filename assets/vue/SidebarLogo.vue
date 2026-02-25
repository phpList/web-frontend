<template>
  <RouterLink to="/" class="sidebar-logo">
    <div class="sidebar-logo__mark">
      <img
          class="sidebar-logo__img"
          :src="logo"
          alt="Logo"
      />
    </div>

    <div class="sidebar-logo__text">
      <span class="sidebar-logo__name">{{ name }}</span>
      <span
          v-if="version"
          class="sidebar-logo__version"
      >
        {{ version }}
      </span>
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

<style scoped>
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 1.25rem 1.5rem;
  text-decoration: none;
}

.sidebar-logo__mark {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-logo__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.sidebar-logo__text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.sidebar-logo__name {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}

.sidebar-logo__version {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6366f1;
}
</style>
