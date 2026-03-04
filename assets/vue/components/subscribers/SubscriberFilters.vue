<template>
  <div class="flex gap-2 flex-wrap">
    <button
      v-for="filter in filters"
      :key="filter.id"
      class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
      :class="[
        activeFilter === filter.id
          ? 'bg-ext-wf2 text-ext-wf1'
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
  { id: 'unconfirmed', label: 'Unconfirmed' },
  { id: 'blacklisted', label: 'Blacklisted' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'non-blacklisted', label: 'Non-Blacklisted' },
]
</script>
