<template>
  <div class="bg-white rounded-xl border border-slate-200  shadow-sm overflow-hidden">
    <div class="p-4 sm:p-6 border-b border-slate-200 ">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h2 class="text-xl font-bold text-slate-900 ">Subscriber Directory</h2>
        <div class="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <div class="flex gap-2 flex-1 sm:w-[400px]">
            <div class="relative flex-1">
              <BaseIcon name="search" class="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                v-model="searchQuery"
                placeholder="Search subscribers..."
                class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200  rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                type="text"
                @input="handleSearch"
              >
            </div>
            <select
                v-model="searchColumn"
                class="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                @change="handleSearch"
            >
              <option v-for="col in searchColumns" :key="col.id" :value="col.id">
                {{ col.label }}
              </option>
            </select>
          </div>
          <div class="flex gap-2">
            <button class="flex-1 sm:flex-none p-2 border border-slate-200  rounded-lg hover:bg-slate-50 transition-colors flex justify-center items-center">
              <BaseIcon name="filter" class="w-4 h-4 text-slate-500" />
            </button>
            <button
                class="flex-[3] sm:flex-none px-4 py-2 bg-ext-wf1 hover:bg-ext-wf3 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                @click="exportSubscribers"
            >
              <BaseIcon name="download" class="w-4 h-4" />
              <span class="flex items-center whitespace-nowrap">Export CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="px-6 py-4 bg-slate-50/50 border-b border-slate-200">
      <SubscriberFilters @filter-change="handleFilterChange" />
    </div>
    <SubscriberTable :subscribers="subscribers" />
    <div class="p-4 sm:p-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
      <div class="text-center sm:text-left">
        Showing <span class="font-medium text-slate-900">{{ subscribers.length }}</span> of <span class="font-medium text-slate-900">{{ pagination.total }}</span> subscribers
      </div>
      <div class="flex gap-2 w-full sm:w-auto">
        <button
          class="flex-1 sm:flex-none px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          :disabled="pagination.isFirstPage"
          @click="previousPage"
        >
          Previous
        </button>
        <button
          class="flex-1 sm:flex-none px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          :disabled="!pagination.hasMore"
          @click="nextPage"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import BaseIcon from '../base/BaseIcon.vue'
import SubscriberFilters from './SubscriberFilters.vue'
import SubscriberTable from './SubscriberTable.vue'
import { inject, ref, onMounted, watch } from 'vue'
import { subscriberFilters } from './subscriberFilters'

const initialSubscribers = inject('subscribers', [])
const initialPagination = inject('pagination', {
  total: 0,
  isFirstPage: true,
  hasMore: false,
  afterId: null,
  prevId: null
})

const subscribers = ref(initialSubscribers)
const pagination = ref(initialPagination)
const currentFilter = ref(null)
const searchQuery = ref('')
const searchColumn = ref('email')
let searchTimeout = null

const searchColumns = [
  { id: 'email', label: 'Email' },
  { id: 'foreignKey', label: 'Foreign Key' },
  { id: 'uniqueId', label: 'Unique ID' }
]

const allowedFilters = subscriberFilters.map(f => f.id)

const updateUrl = (afterId = null) => {
  const url = new URL(window.location.href)

  allowedFilters.forEach(filter => {
    url.searchParams.delete(filter)
  })

  if (currentFilter.value && currentFilter.value !== 'all') {
    url.searchParams.set(currentFilter.value, 'true')
  }

  if (searchQuery.value) {
    url.searchParams.set('findColumn', searchColumn.value)
    url.searchParams.set('findValue', searchQuery.value)
  } else {
    url.searchParams.delete('findColumn')
    url.searchParams.delete('findValue')
  }

  if (afterId) {
    url.searchParams.set('after_id', afterId)
  } else {
    url.searchParams.delete('after_id')
  }

  window.history.replaceState({}, '', url)
}

const getFilterFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  const foundFilter = allowedFilters.find(filter => params.get(filter) === 'true')
  
  if (params.has('findValue')) {
    searchQuery.value = params.get('findValue')
  }

  if (params.has('findColumn')) {
    searchColumn.value = params.get('findColumn')
  }

  return foundFilter || 'all'
}

onMounted(() => {
  currentFilter.value = getFilterFromUrl()
  fetchSubscribers()
})

const fetchSubscribers = async (afterId = null) => {
  const url = new URL('/subscribers', window.location.origin)
  if (afterId !== null) {
    url.searchParams.set('after_id', afterId)
  }

  if (currentFilter.value && currentFilter.value !== 'all') {
    url.searchParams.set(currentFilter.value, 'true')
  }

  if (searchQuery.value) {
    url.searchParams.set('findColumn', searchColumn.value)
    url.searchParams.set('findValue', searchQuery.value)
  }

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' }
    })

    const data = await response.json()

    subscribers.value = data.items
    pagination.value = data.pagination

    updateUrl(afterId)
  } catch (error) {
    console.error('Failed to fetch subscribers:', error)
  }
}

const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    fetchSubscribers()
  }, 300)
}

const nextPage = () => {
  if (pagination.value.hasMore) {
    fetchSubscribers(pagination.value.afterId)
  }
}

const previousPage = () => {
  if (!pagination.value.isFirstPage) {
    const id = pagination.value.prevId === 0 ? null : pagination.value.prevId
    fetchSubscribers(id)
  }
}

const handleFilterChange = (filterId) => {
  currentFilter.value = filterId || 'all'
  fetchSubscribers()
}

const exportSubscribers = () => {
  const url = new URL('/subscribers/export', window.location.origin)
  if (currentFilter.value && currentFilter.value !== 'all') {
    url.searchParams.set(currentFilter.value, 'true')
  }

  if (searchQuery.value) {
    url.searchParams.set('findColumn', searchColumn.value)
    url.searchParams.set('findValue', searchQuery.value)
  }

  if (pagination.value.total > 0) {
    url.searchParams.set('limit', pagination.value.total)
  }

  window.location.href = url.toString()
}
</script>
