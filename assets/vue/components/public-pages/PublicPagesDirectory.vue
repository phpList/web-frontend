<template>
  <section class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
    <header class="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
      <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">Subscribe Pages</h2>
      <BaseButton variant="accent" icon="plus" :disabled="isLoading" @click="handleCreatePage">
        Add New Subscribe Page
      </BaseButton>
    </header>

    <BaseDataTable
        :items="subscribePages"
        :is-loading="isLoading"
        :load-error="loadError"
        loading-message="Loading subscribe pages..."
        empty-message="No subscribe pages found."
        :colspan="6"
    >
      <template #head>
        <th class="px-6 py-4">ID</th>
        <th class="px-6 py-4">Title</th>
        <th class="px-6 py-4">Owner</th>
        <th class="px-6 py-4">Default</th>
        <th class="px-6 py-4">Active</th>
        <th class="px-6 py-4 text-right">Actions</th>
      </template>

      <template #row="{ item: page }">
        <td class="px-6 py-4 text-slate-600 dark:text-slate-300">{{ page.id }}</td>
        <td class="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{{ page.title || `Subscribe page #${page.id}` }}</td>
        <td class="px-6 py-4 text-slate-700 dark:text-slate-200">{{ page.owner?.loginName || page.owner?.email || 'No owner' }}</td>
        <td class="px-6 py-4">
          <label class="inline-flex items-center cursor-pointer">
            <input
              type="radio"
              class="w-4 h-4 text-ext-wf1 border-slate-300 dark:border-slate-600 focus:ring-ext-wf2"
              :checked="page.isDefault"
              :disabled="isRowBusy(page.id)"
              @change="handleSetDefault(page)"
            >
          </label>
        </td>
        <td class="px-6 py-4">
          <label class="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-ext-wf1 focus:ring-ext-wf2 accent-ext-wf1"
              :checked="page.active"
              :disabled="isRowBusy(page.id)"
              @change="handleToggleActive(page, $event)"
            >
          </label>
        </td>
        <td colspan="5" class="px-6 py-3">
          <div class="flex flex-wrap items-center justify-end gap-2">
            <ActionButton variant="info" icon="eye" :disabled="isRowBusy(page.id)" @click="handlePreview(page)">
              Preview
            </ActionButton>

            <ActionButton icon="edit" :disabled="isRowBusy(page.id)" @click="handleEdit(page)">
              Edit
            </ActionButton>

            <ActionButton variant="danger" icon="delete" :disabled="isRowBusy(page.id)" @click="handleDelete(page)">
              Delete
            </ActionButton>
          </div>
        </td>
      </template>

      <template #card="{ item: page }">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">#{{ page.id }}</p>
            <p class="font-semibold text-slate-900 dark:text-slate-100">{{ page.title || `Subscribe page #${page.id}` }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Owner: {{ page.owner?.loginName || page.owner?.email || 'No owner' }}</p>
          </div>
          <div class="text-xs text-slate-500 dark:text-slate-400">
            {{ isRowBusy(page.id) ? 'Updating...' : '' }}
          </div>
        </div>

        <div class="flex items-center justify-between gap-3">
          <label class="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
            <input
              type="radio"
              class="w-4 h-4 text-ext-wf1 border-slate-300 dark:border-slate-600 focus:ring-ext-wf2"
              :checked="page.isDefault"
              :disabled="isRowBusy(page.id)"
              @change="handleSetDefault(page)"
            >
            Default
          </label>

          <label class="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-ext-wf1 focus:ring-ext-wf2 accent-ext-wf1"
              :checked="page.active"
              :disabled="isRowBusy(page.id)"
              @change="handleToggleActive(page, $event)"
            >
            Active
          </label>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <ActionButton block variant="info" icon="eye" :disabled="isRowBusy(page.id)" @click="handlePreview(page)">
            Preview
          </ActionButton>

          <ActionButton block icon="edit" :disabled="isRowBusy(page.id)" @click="handleEdit(page)">
            Edit
          </ActionButton>

          <ActionButton block variant="danger" icon="delete" :disabled="isRowBusy(page.id)" @click="handleDelete(page)">
            Delete
          </ActionButton>
        </div>
      </template>
    </BaseDataTable>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Requests } from '@tatevikgr/rest-api-client'
import BaseButton from '../base/BaseButton.vue'
import ActionButton from '../base/ActionButton.vue'
import BaseDataTable from '../base/BaseDataTable.vue'
import { subscribePagesClient } from '../../api'

const router = useRouter()
const subscribePages = ref([])
const isLoading = ref(false)
const loadError = ref('')
const rowBusyState = ref({})

const fetchSubscribePages = async ({ limit = 100, maxPages = 100 } = {}) => {
  const pages = []
  let afterId = null

  for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
    const response = await subscribePagesClient.getSubscribePages(afterId, limit)
    const items = Array.isArray(response?.items) ? response.items : []
    pages.push(...items)

    const hasMore = response?.pagination?.hasMore === true
    const nextCursor = response?.pagination?.nextCursor

    if (!hasMore || !Number.isFinite(nextCursor) || nextCursor === afterId) {
      break
    }

    afterId = nextCursor
  }

  return pages.sort((a, b) => a.id - b.id)
}

const loadSubscribePages = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    subscribePages.value = await fetchSubscribePages()
  } catch (error) {
    console.error('Failed to load subscribe pages:', error)
    subscribePages.value = []
    loadError.value = error?.message || 'Failed to load subscribe pages.'
  } finally {
    isLoading.value = false
  }
}

const setRowBusy = (id, busy) => {
  rowBusyState.value = {
    ...rowBusyState.value,
    [id]: busy
  }
}

const isRowBusy = (id) => !!rowBusyState.value[id]

const withRowTask = async (id, task) => {
  setRowBusy(id, true)
  try {
    await task()
  } finally {
    setRowBusy(id, false)
  }
}

const handleCreatePage = async () => {
  await router.push({ name: 'public-page-create' })
}

const handleEdit = async (page) => {
  await router.push({ name: 'public-page-edit', params: { pageId: page.id } })
}

const handleDelete = async (page) => {
  const confirmed = window.confirm(`Delete subscribe page "${page.title || `#${page.id}`}"?`)
  if (!confirmed) {
    return
  }

  await withRowTask(page.id, async () => {
    try {
      await subscribePagesClient.deleteSubscribePage(page.id)
      await loadSubscribePages()
    } catch (error) {
      console.error('Failed to delete subscribe page:', error)
      window.alert(error?.message || 'Failed to delete subscribe page.')
    }
  })
}

const handleToggleActive = async (page, event) => {
  const checked = event?.target?.checked === true

  await withRowTask(page.id, async () => {
    try {
      await subscribePagesClient.updateSubscribePage(
        page.id,
        new Requests.UpdateSubscribePageRequest(page.title || null, checked)
      )
      page.active = checked
    } catch (error) {
      console.error('Failed to update subscribe page active state:', error)
      window.alert(error?.message || 'Failed to update active state.')
    }
  })
}

const handleSetDefault = async (targetPage) => {
  await withRowTask(targetPage.id, async () => {
    // todo: this should post/put to phplist_config defaultsubscribepage
  })
}

const handlePreview = (page) => {
  const previewUrl = `/subscribe/${page.id}`
  window.open(previewUrl, '_blank', 'noopener,noreferrer')
}

onMounted(() => {
  loadSubscribePages()
})
</script>
