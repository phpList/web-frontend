<template>
  <div class="bg-slate-200 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm overflow-hidden">
    <div class="p-4 sm:p-6 space-y-5">
      <!-- Date type -->
      <div class="space-y-2">
        <p class="text-sm font-medium text-slate-800 dark:text-slate-100">{{ t('subscribers.export.date_prompt') }}</p>

        <div class="flex flex-wrap gap-x-5 gap-y-2">
          <label
              v-for="option in dateTypeOptions"
              :key="option.value"
              class="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer mr-2"
          >
            <input
                v-model="form.dateType"
                type="radio"
                name="list-export-date-type"
                class="h-4 w-4 border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-ext-wf1 focus:ring-ext-wf1"
                :value="option.value"
            >
            <span>{{ option.label }}</span>
          </label>
        </div>
      </div>

      <!-- Date range -->
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-3 items-end">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1" for="list-export-date-from">
            {{ t('subscribers.export.date_from') }}
          </label>
          <input
              id="list-export-date-from"
              v-model="form.dateFrom"
              type="date"
              class="block w-full rounded-md border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-700 dark:disabled:text-slate-500"
              :disabled="usesAnyDate"
          >
        </div>

        <div class="hidden lg:flex items-center justify-center pb-2 text-slate-400 dark:text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
                fill-rule="evenodd"
                d="M3 10a1 1 0 011-1h9.586l-2.293-2.293a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L13.586 11H4a1 1 0 01-1-1z"
                clip-rule="evenodd"
            />
          </svg>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1" for="list-export-date-to">
            {{ t('subscribers.export.date_to') }}
          </label>
          <input
              id="list-export-date-to"
              v-model="form.dateTo"
              type="date"
              class="block w-full rounded-md border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-slate-700 dark:disabled:text-slate-500"
              :disabled="usesAnyDate"
          >
        </div>
      </div>

      <!-- Columns -->
      <div class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm font-medium text-slate-800 dark:text-slate-100">{{ t('subscribers.export.columns') }}</p>

          <label class="inline-flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100 cursor-pointer">
            <input
                ref="selectAllColumnsCheckbox"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-ext-wf1 focus:ring-ext-wf1 accent-ext-wf1"
                :checked="allColumnsSelected"
                @change="toggleAllColumns"
            >
            <span>{{ t('subscribers.export.select_all') }}</span>
          </label>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-x-8 gap-y-3">
          <label
              v-for="column in columnOptions"
              :key="column.value"
              class="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 cursor-pointer min-w-0"
          >
            <input
                v-model="form.columns"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-ext-wf1 focus:ring-ext-wf1 shrink-0 accent-ext-wf1"
                :value="column.value"
            >
            <span class="truncate">{{ columnLabel(column) }}</span>
          </label>
        </div>
      </div>

      <p v-if="exportError" class="text-sm text-red-600 dark:text-red-400">{{ exportError }}</p>
    </div>

    <!-- Footer -->
    <div class="px-4 sm:px-6 py-4 border-t border-slate-300 dark:border-slate-700 flex items-center justify-between gap-3">
      <button
          type="button"
          class="inline-flex items-center justify-center rounded-md border border-transparent bg-ext-wf1 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-ext-wf3 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="exportSubscribers"
      >
        {{ t('subscribers.export.export') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { subscriberAttributesClient } from '../../api'

const { t } = useI18n()

onMounted(async () => {
  const allAttributes = []
  let offset = 0
  const limit = 100
  let hasMore = true

  try {
    while (hasMore) {
      const data = await subscriberAttributesClient.getAttributeDefinitions(offset, limit)
      const items = Array.isArray(data?.items) ? data.items : []

      allAttributes.push(...items)

      if (items.length < limit) {
        hasMore = false
      } else {
        offset += limit
      }
    }

    const dynamicColumns = allAttributes.map(attr => ({
      value: attr.name,
      label: capitalizeFirst(attr.name)
    }))

    columnOptions.value = [
      ...columnOptions.value,
      ...dynamicColumns
    ]

    if (!form.value.columns?.length) {
      form.value.columns = columnOptions.value.map(c => c.value)
    }
  } catch (err) {
    console.error('Failed to load attribute definitions', err)
  }
})
const capitalizeFirst = (s) => s ? s[0].toUpperCase() + s.slice(1) : ''

const props = defineProps({
  listId: {
    type: Number,
  },
  listName: {
    type: String,
    default: ''
  },
  directoryFilter: {
    type: String,
    default: 'all'
  },
})

const dateTypeOptions = computed(() => [
  { value: 'any', label: t('subscribers.export.date_types.any') },
  { value: 'signup', label: t('subscribers.export.date_types.signup') },
  { value: 'changed', label: t('subscribers.export.date_types.changed') },
  { value: 'changelog', label: t('subscribers.export.date_types.changelog') },
  { value: 'subscribed', label: t('subscribers.export.date_types.subscribed') }
])

// Built-in columns carry a translation key; attribute columns carry the attribute name as label.
const columnLabel = (column) => (column.labelKey ? t(column.labelKey) : column.label)

const columnOptions = ref([
  { value: 'id', labelKey: 'subscribers.export.columns.id' },
  { value: 'email', labelKey: 'subscribers.export.columns.email' },
  { value: 'confirmed', labelKey: 'subscribers.export.columns.confirmed' },
  { value: 'blacklisted', labelKey: 'subscribers.export.columns.blacklisted' },
  // { value: 'manualConfirm', label: 'Did this subscriber manually confirm' },
  { value: 'bounceCount', labelKey: 'subscribers.export.columns.bounce_count' },
  { value: 'createdAt', labelKey: 'subscribers.export.columns.created_at' },
  { value: 'updatedAt', labelKey: 'subscribers.export.columns.updated_at' },
  { value: 'uniqueId', labelKey: 'subscribers.export.columns.unique_id' },
  { value: 'htmlEmail', labelKey: 'subscribers.export.columns.html_email' },
  { value: 'rssFrequency', labelKey: 'subscribers.export.columns.rss_frequency' },
  { value: 'disabled', labelKey: 'subscribers.export.columns.disabled' },
  { value: 'extraData', labelKey: 'subscribers.export.columns.extra_data' },
  { value: 'foreignKey', labelKey: 'subscribers.export.columns.foreign_key' },
])

const form = ref({
  dateType: 'any',
  dateFrom: '',
  dateTo: '',
  columns: columnOptions.value.map((column) => column.value)
})

const exportError = ref('')
const selectAllColumnsCheckbox = ref(null)

const usesAnyDate = computed(() => form.value.dateType === 'any')

const allColumnsSelected = computed(() => {
  return (
      columnOptions.value.length > 0 &&
      form.value.columns.length === columnOptions.value.length
  )
})

const someColumnsSelected = computed(() => {
  return form.value.columns.length > 0 && !allColumnsSelected.value
})

watchEffect(() => {
  if (!selectAllColumnsCheckbox.value) return
  selectAllColumnsCheckbox.value.indeterminate = someColumnsSelected.value
})

watch(() => form.value.dateType, (dateType) => {
  exportError.value = ''
  if (dateType === 'any') {
    form.value.dateFrom = ''
    form.value.dateTo = ''
  }
})

watch(() => [form.value.dateFrom, form.value.dateTo], () => {
  exportError.value = ''
})

const toggleAllColumns = (event) => {
  if (event.target.checked) {
    form.value.columns = columnOptions.value.map((column) => column.value)
    return
  }

  form.value.columns = []
}

const exportSubscribers = () => {
  if (form.value.columns.length === 0) {
    exportError.value = t('subscribers.export.errors.no_columns')
    return
  }
  if (!usesAnyDate.value && form.value.dateFrom && form.value.dateTo && form.value.dateFrom > form.value.dateTo) {
    exportError.value = t('subscribers.export.errors.date_order')
    return
  }

  const params = new URLSearchParams()
  if (props.listId) {
    params.set('list_id', String(props.listId))
  }

  if (props.directoryFilter && props.directoryFilter !== 'all') {
    params.set(props.directoryFilter, 'true')
  }

  params.set('date_type', form.value.dateType)

  if (!usesAnyDate.value) {
    if (form.value.dateFrom) {
      params.set('date_from', form.value.dateFrom)
    }

    if (form.value.dateTo) {
      params.set('date_to', form.value.dateTo)
    }
  }

  form.value.columns.forEach((column) => {
    params.append('columns[]', column)
  })

  window.location.href = `/subscribers/export?${params.toString()}`
}
</script>
