<template>
  <section class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <header class="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
      <h2 class="text-xl font-bold text-slate-900">Subscribe Pages</h2>
      <button
        type="button"
        class="inline-flex shrink-0 items-center gap-2 whitespace-nowrap min-w-max px-4 py-2 bg-ext-wf1 text-white text-xs font-bold rounded-lg hover:bg-ext-wf3 transition-shadow shadow-sm shadow-indigo-500/20 disabled:opacity-60"
        :disabled="isLoading"
        @click="handleCreatePage"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"></path>
          <path d="M12 5v14"></path>
        </svg>
        Add New Subscribe Page
      </button>
    </header>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm hidden md:table">
        <thead class="bg-slate-50 text-slate-500 font-medium">
        <tr>
          <th class="px-6 py-4">ID</th>
          <th class="px-6 py-4">Title</th>
          <th class="px-6 py-4">Owner</th>
          <th class="px-6 py-4">Default</th>
          <th class="px-6 py-4">Active</th>
          <th class="px-6 py-4 text-right">Actions</th>
        </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
        <template v-for="page in subscribePages" :key="page.id">
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-6 py-4 text-slate-600">{{ page.id }}</td>
            <td class="px-6 py-4 font-medium text-slate-900">{{ page.title || `Subscribe page #${page.id}` }}</td>
            <td class="px-6 py-4 text-slate-700">{{ page.ownerName }}</td>
            <td class="px-6 py-4">
              <label class="inline-flex items-center cursor-pointer">
                <input
                  type="radio"
                  class="w-4 h-4 text-ext-wf1 border-slate-300 focus:ring-ext-wf2"
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
                  class="w-4 h-4 rounded border-slate-300 text-ext-wf1 focus:ring-ext-wf2"
                  :checked="page.active"
                  :disabled="isRowBusy(page.id)"
                  @change="handleToggleActive(page, $event)"
                >
              </label>
            </td>
            <td class="px-6 py-4 text-right text-xs text-slate-400">
              {{ isRowBusy(page.id) ? 'Updating...' : '' }}
            </td>
          </tr>
          <tr class="bg-slate-50/60">
            <td class="px-6 py-3"></td>
            <td colspan="5" class="px-6 py-3">
              <div class="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-60"
                  :disabled="isRowBusy(page.id)"
                  @click="handleResetStyling(page)"
                >
                  <BaseIcon name="repeat" class="w-3.5 h-3.5" />
                  Reset Styling
                </button>

                <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-60"
                  :disabled="isRowBusy(page.id)"
                  @click="handlePreview(page)"
                >
                  <BaseIcon name="eye" class="w-3.5 h-3.5" />
                  Preview
                </button>

                <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
                  :disabled="isRowBusy(page.id)"
                  @click="handleEdit(page)"
                >
                  <BaseIcon name="edit" class="w-3.5 h-3.5" />
                  Edit
                </button>

                <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                  :disabled="isRowBusy(page.id)"
                  @click="handleDelete(page)"
                >
                  <BaseIcon name="delete" class="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </template>

        <tr v-if="isLoading">
          <td colspan="6" class="px-6 py-8 text-center text-slate-500">
            Loading subscribe pages...
          </td>
        </tr>

        <tr v-else-if="loadError">
          <td colspan="6" class="px-6 py-8 text-center text-red-600">
            {{ loadError }}
          </td>
        </tr>

        <tr v-else-if="subscribePages.length === 0">
          <td colspan="6" class="px-6 py-8 text-center text-slate-500">
            No subscribe pages found.
          </td>
        </tr>
        </tbody>
      </table>

      <div class="block md:hidden divide-y divide-slate-100">
        <article
          v-for="page in subscribePages"
          :key="`mobile-${page.id}`"
          class="p-4 space-y-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-500">#{{ page.id }}</p>
              <p class="font-semibold text-slate-900">{{ page.title || `Subscribe page #${page.id}` }}</p>
              <p class="text-xs text-slate-500 mt-1">Owner: {{ page.ownerName }}</p>
            </div>
            <div class="text-xs text-slate-500">
              {{ isRowBusy(page.id) ? 'Updating...' : '' }}
            </div>
          </div>

          <div class="flex items-center justify-between gap-3">
            <label class="inline-flex items-center gap-2 text-xs text-slate-700">
              <input
                type="radio"
                class="w-4 h-4 text-ext-wf1 border-slate-300 focus:ring-ext-wf2"
                :checked="page.isDefault"
                :disabled="isRowBusy(page.id)"
                @change="handleSetDefault(page)"
              >
              Default
            </label>

            <label class="inline-flex items-center gap-2 text-xs text-slate-700">
              <input
                type="checkbox"
                class="w-4 h-4 rounded border-slate-300 text-ext-wf1 focus:ring-ext-wf2"
                :checked="page.active"
                :disabled="isRowBusy(page.id)"
                @change="handleToggleActive(page, $event)"
              >
              Active
            </label>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-60"
              :disabled="isRowBusy(page.id)"
              @click="handleResetStyling(page)"
            >
              <BaseIcon name="repeat" class="w-3.5 h-3.5" />
              Reset
            </button>

            <button
              type="button"
              class="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-60"
              :disabled="isRowBusy(page.id)"
              @click="handlePreview(page)"
            >
              <BaseIcon name="eye" class="w-3.5 h-3.5" />
              Preview
            </button>

            <button
              type="button"
              class="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
              :disabled="isRowBusy(page.id)"
              @click="handleEdit(page)"
            >
              <BaseIcon name="edit" class="w-3.5 h-3.5" />
              Edit
            </button>

            <button
              type="button"
              class="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
              :disabled="isRowBusy(page.id)"
              @click="handleDelete(page)"
            >
              <BaseIcon name="delete" class="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </article>

        <div
          v-if="isLoading"
          class="px-4 py-8 text-center text-slate-500 text-sm"
        >
          Loading subscribe pages...
        </div>

        <div
          v-else-if="loadError"
          class="px-4 py-8 text-center text-red-600 text-sm"
        >
          {{ loadError }}
        </div>

        <div
          v-else-if="subscribePages.length === 0"
          class="px-4 py-8 text-center text-slate-500 text-sm"
        >
          No subscribe pages found.
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { Requests } from '@tatevikgr/rest-api-client'
import BaseIcon from '../base/BaseIcon.vue'
import apiClient, { subscribePagesClient } from '../../api'

const MAX_PROBED_PAGES = 50
const PROBE_CHUNK_SIZE = 10

const subscribePages = ref([])
const isLoading = ref(false)
const loadError = ref('')
const rowBusyState = ref({})

const isNotFoundError = (error) =>
  error?.status === 404
  || error?.response?.status === 404
  || error?.name === 'NotFoundException'

const isTruthyValue = (value) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value !== 'string') return false
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

const normalizeOwnerName = (owner) => {
  if (!owner || typeof owner !== 'object') {
    return 'Nobody'
  }

  return owner.loginName || owner.login_name || owner.fullName || owner.full_name || owner.email || owner.name || 'Nobody'
}

const getDefaultFlag = (items = []) => {
  const defaultItem = items.find((item) =>
    typeof item?.name === 'string'
    && /(is_)?default(_page)?/i.test(item.name)
  )

  if (!defaultItem) {
    return { isDefault: false, defaultFieldName: null }
  }

  return {
    isDefault: isTruthyValue(defaultItem.data),
    defaultFieldName: defaultItem.name
  }
}

const getPageData = async (id) => {
  try {
    const response = await apiClient.get(`subscribe-pages/${id}/data`)
    return Array.isArray(response) ? response : []
  } catch (error) {
    if (isNotFoundError(error)) {
      return []
    }
    throw error
  }
}

const mapSubscribePage = async (page) => {
  const pageData = await getPageData(page.id)
  const { isDefault, defaultFieldName } = getDefaultFlag(pageData)

  return {
    id: page.id,
    title: page.title || '',
    active: !!page.active,
    ownerName: normalizeOwnerName(page.owner),
    isDefault,
    defaultFieldName
  }
}

const fetchSubscribePages = async () => {
  const discoveredPages = []

  for (let startId = 1; startId <= MAX_PROBED_PAGES; startId += PROBE_CHUNK_SIZE) {
    const ids = Array.from(
      { length: Math.min(PROBE_CHUNK_SIZE, MAX_PROBED_PAGES - startId + 1) },
      (_, index) => startId + index
    )

    const chunkResults = await Promise.all(
      ids.map(async (id) => {
        try {
          const page = await subscribePagesClient.getSubscribePage(id)
          return await mapSubscribePage(page)
        } catch (error) {
          if (isNotFoundError(error)) {
            return null
          }
          throw error
        }
      })
    )

    discoveredPages.push(...chunkResults.filter(Boolean))
  }

  return discoveredPages.sort((a, b) => a.id - b.id)
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

const setPageDataItem = async (id, name, value) => {
  await apiClient.put(`subscribe-pages/${id}/data`, { name, value })
}

const withRowTask = async (id, task) => {
  setRowBusy(id, true)
  try {
    await task()
  } finally {
    setRowBusy(id, false)
  }
}

const handleCreatePage = async () => {
  const title = window.prompt('Enter title for the new subscribe page:')
  if (title === null) {
    return
  }

  const trimmedTitle = title.trim()
  if (!trimmedTitle) {
    window.alert('Title cannot be empty.')
    return
  }

  try {
    await subscribePagesClient.createSubscribePage(
      new Requests.CreateSubscribePageRequest(trimmedTitle, true)
    )
    await loadSubscribePages()
  } catch (error) {
    console.error('Failed to create subscribe page:', error)
    window.alert(error?.message || 'Failed to create subscribe page.')
  }
}

const handleEdit = async (page) => {
  const nextTitle = window.prompt('Edit subscribe page title:', page.title || '')
  if (nextTitle === null) {
    return
  }

  const trimmedTitle = nextTitle.trim()
  if (!trimmedTitle) {
    window.alert('Title cannot be empty.')
    return
  }

  await withRowTask(page.id, async () => {
    try {
      await subscribePagesClient.updateSubscribePage(
        page.id,
        new Requests.UpdateSubscribePageRequest(trimmedTitle, page.active)
      )
      await loadSubscribePages()
    } catch (error) {
      console.error('Failed to update subscribe page:', error)
      window.alert(error?.message || 'Failed to update subscribe page.')
    }
  })
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
  const currentDefault = subscribePages.value.find((page) => page.isDefault)
  const defaultFieldName = targetPage.defaultFieldName || currentDefault?.defaultFieldName || 'default'

  await withRowTask(targetPage.id, async () => {
    try {
      await setPageDataItem(targetPage.id, defaultFieldName, '1')

      if (currentDefault && currentDefault.id !== targetPage.id) {
        await setPageDataItem(currentDefault.id, currentDefault.defaultFieldName || defaultFieldName, '0')
      }

      await loadSubscribePages()
    } catch (error) {
      console.error('Failed to set default subscribe page:', error)
      window.alert(error?.message || 'Failed to set default subscribe page.')
    }
  })
}

const handleResetStyling = async (page) => {
  await withRowTask(page.id, async () => {
    try {
      const items = await getPageData(page.id)
      const styleItems = items.filter((item) =>
        typeof item?.name === 'string' && /(style|css)/i.test(item.name)
      )

      if (styleItems.length === 0) {
        window.alert('No style overrides were found for this subscribe page.')
        return
      }

      await Promise.all(
        styleItems.map((item) => setPageDataItem(page.id, item.name, null))
      )

      window.alert('Styling was reset to default values.')
    } catch (error) {
      console.error('Failed to reset styling:', error)
      window.alert(error?.message || 'Failed to reset styling.')
    }
  })
}

const handlePreview = (page) => {
  const previewUrl = `/?p=subscribe&id=${page.id}`
  window.open(previewUrl, '_blank', 'noopener,noreferrer')
}

onMounted(() => {
  loadSubscribePages()
})
</script>
