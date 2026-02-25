<template>
  <li>
    <RouterLink
        :to="item.route"
        class="sidebar-item"
        :class="{ 'sidebar-item--active': isActive }"
    >
      <BaseIcon :name="item.icon" class="sidebar-item__icon" />
      <span class="sidebar-item__label">{{ item.label }}</span>

      <BaseBadge
          v-if="item.badge !== null && item.badge !== undefined"
          variant="counter"
          class="sidebar-item__badge"
      >
        {{ item.badge }}
      </BaseBadge>
    </RouterLink>
  </li>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BaseIcon from './components/base/BaseIcon.vue'
import BaseBadge from './components/base/BaseBadge.vue'

const props = defineProps({
  item: { type: Object, required: true },
})

const route = useRoute()
const isActive = computed(() => route.path === props.item.route)
</script>
