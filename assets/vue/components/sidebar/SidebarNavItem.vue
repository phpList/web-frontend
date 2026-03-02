<template>
  <li class="list-unstyled mb-1">
    <RouterLink
        :to="item.route"
        custom
        v-slot="{ navigate, href, isActive }"
    >
      <a
          :href="href"
          @click="navigate"
          class="d-flex align-items-center px-3 py-1 rounded fw-bold"
          :class="isActive ? 'bg-light text-primary' : 'text-dark'"
      >
        <BaseIcon
            :name="item.icon"
            class="me-2"
            :muted="!isActive"
        />

        <span>{{ item.label }}</span>

        <BaseBadge
            v-if="item.badge != null"
            variant="counter"
            class="ms-auto"
        >
          {{ item.badge }}
        </BaseBadge>
      </a>
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

