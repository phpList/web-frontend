<template>
  <li class="list-unstyled mb-1">
    <RouterLink
        :to="item.route"
        class="d-flex align-items-center px-3 py-2 rounded sidebar-link"
        :class="{
      'bg-primary bg-opacity-10 text-primary fw-semibold': isActive,
      'text-secondary': !isActive
    }"
        style="white-space: nowrap;"
    >
      <BaseIcon
          :name="item.icon"
          class="me-2 mr-2"
          :class="isActive ? 'text-primary' : 'text-secondary'"
      />

      <span class="text-dark font-weight-bold">{{ item.label }}</span>

      <BaseBadge
          v-if="item.badge !== null && item.badge !== undefined"
          variant="counter"
          class="ms-auto"
      >
        {{ item.badge }}
      </BaseBadge>
    </RouterLink>
  </li>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BaseIcon from '../base/BaseIcon.vue'
import BaseBadge from '../base/BaseBadge.vue'

const props = defineProps({
  item: { type: Object, required: true },
})

const route = useRoute()
const isActive = computed(() => route.path === props.item.route)
</script>

