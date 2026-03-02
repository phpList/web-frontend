<template>
  <div class="flex gap-2 flex-wrap">
    <button
      v-for="filter in filters"
      :key="filter.id"
      class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
      :class="[
        activeFilter === filter.id
          ? 'bg-blue-100 text-blue-700'
          : 'bg-slate-100  text-slate-600  hover:bg-slate-200'
      ]"
      @click="activeFilter = filter.id"
    >
      {{ filter.label }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeFilter = ref('all')

const filters = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'unconfirmed', label: 'Unconfirmed' },
  { id: 'bounced', label: 'Bounced' },
  { id: 'unsubscribed', label: 'Unsubscribed' },
]
</script>
