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
            <td class="px-6 py-4 text-slate-700">{{ page.owner.loginName }}</td>
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
            <td colspan="5" class="px-6 py-3">
              <div class="flex flex-wrap items-center justify-end gap-2">
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
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
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
              class="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-60"
              :disabled="isRowBusy(page.id)"
              @click="handlePreview(page)"
            >
              <BaseIcon name="eye" class="w-3.5 h-3.5" />
              Preview
            </button>

            <button
              type="button"
              class="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
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
import { useRouter } from 'vue-router'
import { Requests } from '@tatevikgr/rest-api-client'
import BaseIcon from '../base/BaseIcon.vue'
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
  const previewUrl = `/?p=subscribe&id=${page.id}`
  window.open(previewUrl, '_blank', 'noopener,noreferrer')
}

onMounted(() => {
  loadSubscribePages()
})
</script>
