<template>
  <div class="flex gap-2 flex-wrap">
    <button
        v-for="filter in filters"
        :key="filter.id"
        class="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
        :class="[
        activeFilter === filter.id
          ? 'bg-ext-wf2 text-ext-wf1'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      ]"
        @click="toggleFilter(filter.id)"
    >
      {{ filter.label }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { subscriberFilters } from './subscriberFilters'

const activeFilter = ref('all')

const emit = defineEmits(['filter-change'])

const toggleFilter = (filterId) => {
  if (activeFilter.value === filterId) {
    activeFilter.value = null
  } else {
    activeFilter.value = filterId
  }

  emit('filter-change', activeFilter.value)
}

const filters = subscriberFilters
</script>
