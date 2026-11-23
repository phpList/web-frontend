<template>
  <div class="bg-slate-200 dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700  shadow-sm overflow-hidden">
    <div class="p-4 sm:p-6 border-b border-slate-300 dark:border-slate-700 ">
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100 ">{{ t('subscribers.title') }}</h2>
        <div class="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <div class="flex gap-2 flex-1 sm:w-[400px]">
            <div class="relative flex-1">
              <BaseIcon name="search" class="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                v-model="searchQuery"
                :placeholder="t('subscribers.directory.search_placeholder')"
                class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-600  rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                type="text"
                @input="handleSearch"
              >
            </div>
            <select
                v-model="searchColumn"
                class="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                @change="handleSearch"
            >
              <option v-for="col in searchColumns" :key="col.id" :value="col.id">
                {{ col.label }}
              </option>
            </select>
          </div>
          <div class="flex gap-2">
            <input
                ref="fileInput"
                type="file"
                class="hidden"
                accept=".csv"
                @change="handleFileChange"
            >
            <button
                class="flex-[3] sm:flex-none px-4 py-2 bg-ext-wf1 hover:bg-ext-wf3 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="isImporting"
                @click="importSubscribers"
            >
              <BaseIcon v-if="!isImporting" name="upload" class="w-4 h-4" />
              <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span class="flex items-center whitespace-nowrap">{{ isImporting ? t('subscribers.directory.importing') : t('subscribers.directory.import_csv') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-300 dark:border-slate-700">
      <SubscriberFilters @filter-change="handleFilterChange" />
    </div>
    <SubscriberTable :subscribers="subscribers" @view="openSubscriberModal" />
    <SubscriberModal
      :is-open="isModalOpen"
      :subscriber-id="selectedSubscriberId"
      @close="closeSubscriberModal"
      @updated="handleSubscriberUpdated"
    />
    <ImportResult
      :is-import-result-open="isImportResultOpen"
      :import-result="importResult"
      @close="isImportResultOpen = false"
    />
    <div class="p-4 sm:p-6 border-t border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500 dark:text-slate-350">
      <div class="text-center sm:text-left">
        {{ t('subscribers.directory.showing', { shown: subscribers.length, total: pagination.total }) }}
      </div>
      <div class="flex gap-2 w-full sm:w-auto">
        <button
          class="flex-1 sm:flex-none px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          :disabled="pagination.isFirstPage"
          @click="previousPage"
        >
          {{ t('common.previous') }}
        </button>
        <button
          class="flex-1 sm:flex-none px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          :disabled="!pagination.hasMore"
          @click="nextPage"
        >
          {{ t('common.next') }}
        </button>
      </div>
    </div>
  </div>

  <ListSubscribersExportPanel :directory-filter="currentFilter || 'all'"/>
</template>

<script setup>
import BaseIcon from '../base/BaseIcon.vue'
import SubscriberFilters from './SubscriberFilters.vue'
import SubscriberTable from './SubscriberTable.vue'
import SubscriberModal from './SubscriberModal.vue'
import ImportResult from './ImportResult.vue'
import { computed, inject, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { subscriberFilters } from './subscriberFilters'
import { backendFetch, subscribersClient } from '../../api'
import ListSubscribersExportPanel from "../lists/ListSubscribersExportPanel.vue";

const { t } = useI18n()

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
const isModalOpen = ref(false)
const selectedSubscriberId = ref(null)
const fileInput = ref(null)
const isImporting = ref(false)
const isImportResultOpen = ref(false)
const importResult = ref({
  imported: 0,
  skipped: 0,
  errors: []
})
let searchTimeout = null
let fetchController = null

const searchColumns = computed(() => [
  { id: 'email', label: t('subscribers.search_columns.email') },
  { id: 'foreignKey', label: t('subscribers.search_columns.foreign_key') },
  { id: 'uniqueId', label: t('subscribers.search_columns.unique_id') }
])
const allowedSearchColumns = ['email', 'foreignKey', 'uniqueId']

const allowedFilters = subscriberFilters.map(f => f.id)

const isAllowedSearchColumn = (column) => allowedSearchColumns.includes(column)

const updateUrl = (afterId = null) => {
  const url = new URL(window.location.href)

  allowedFilters.forEach(filter => {
    url.searchParams.delete(filter)
  })

  if (currentFilter.value && currentFilter.value !== 'all') {
    url.searchParams.set(currentFilter.value, 'true')
  }

  if (searchQuery.value && isAllowedSearchColumn(searchColumn.value)) {
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
  const findColumnParam = params.get('findColumn')
  const hasValidFindColumn = isAllowedSearchColumn(findColumnParam)
  
  if (params.has('findValue')) {
    searchQuery.value = params.get('findValue')
  }

  if (hasValidFindColumn) {
    searchColumn.value = findColumnParam
  }

  return foundFilter || 'all'
}

onMounted(() => {
  currentFilter.value = getFilterFromUrl()
  fetchSubscribers()
})

const fetchSubscribers = async (afterId = null) => {
  fetchController?.abort()
  fetchController = new AbortController()
  const { signal } = fetchController

  const url = new URL('/subscribers', window.location.origin)
  if (afterId !== null) {
    url.searchParams.set('after_id', afterId)
  }

  if (currentFilter.value && currentFilter.value !== 'all') {
    url.searchParams.set(currentFilter.value, 'true')
  }

  if (searchQuery.value && isAllowedSearchColumn(searchColumn.value)) {
    url.searchParams.set('findColumn', searchColumn.value)
    url.searchParams.set('findValue', searchQuery.value)
  }

  try {
    const response = await backendFetch(url, {
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      signal
    })

    const data = await response.json()

    subscribers.value = data.items
    pagination.value = data.pagination

    updateUrl(afterId)
  } catch (error) {
    if (error?.name === 'AbortError') return
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

const openSubscriberModal = (id) => {
  selectedSubscriberId.value = id
  isModalOpen.value = true
}

const closeSubscriberModal = () => {
  isModalOpen.value = false
  selectedSubscriberId.value = null
}

const handleSubscriberUpdated = (updatedSubscriber) => {
  const index = subscribers.value.findIndex(s => s.id === updatedSubscriber.id)
  if (index !== -1) {
    subscribers.value[index] = {
      ...subscribers.value[index],
      email: updatedSubscriber.email,
      confirmed: updatedSubscriber.confirmed,
      blacklisted: updatedSubscriber.blacklisted,
      listCount: updatedSubscriber.subscribedLists ? updatedSubscriber.subscribedLists.length : subscribers.value[index].listCount
    }
  }
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

const importSubscribers = () => {
  fileInput.value.click()
}

const handleFileChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  isImporting.value = true
  try {
    importResult.value = await subscribersClient.importSubscribers({
      file,
      listId: 0,
      updateExisting: true
    })
    isImportResultOpen.value = true
    fetchSubscribers()
  } catch (error) {
    console.error('Failed to import subscribers:', error)
    alert(t('subscribers.directory.import_failed'))
  } finally {
    isImporting.value = false
    event.target.value = ''
  }
}

</script>
