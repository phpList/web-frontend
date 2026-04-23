<template>
  <AdminLayout>
    <div class="space-y-6 animate-in fade-in duration-300">
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-500">Mailing List</p>
            <h2 class="text-xl font-bold text-slate-900">
              {{ listName || `List #${listId}` }}
            </h2>
          </div>

          <RouterLink
              to="/lists"
              class="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to Lists
          </RouterLink>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div
            class="p-4 sm:p-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h3 class="text-lg font-semibold text-slate-900">Subscribers</h3>
          <div class="flex flex-col sm:flex-row gap-2 sm:items-center">
            <label class="text-sm text-slate-600">Status</label>
            <select
                v-model="statusFilter"
                class="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All</option>
              <option value="confirmed">Confirmed</option>
              <option value="unconfirmed">Unconfirmed</option>
            </select>
          </div>
        </div>

        <div class="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50">
          <div class="flex flex-col xl:flex-row xl:items-center gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-sm text-slate-600">Selected: {{ selectedSubscribers.length }}</span>
              <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  :disabled="!hasSelection || actionLoading"
                  @click="deleteSelectedSubscribers"
              >
                <BaseIcon name="delete" class="w-3.5 h-3.5" />
                Delete Selected
              </button>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center gap-2 xl:ml-auto">
              <select
                  v-model="selectedTargetListId"
                  class="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  :disabled="actionLoading"
              >
                <option value="">Select target list</option>
                <option v-for="list in availableLists" :key="list.id" :value="String(list.id)">
                  {{ list.name || `List #${list.id}` }}
                </option>
              </select>

              <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors disabled:opacity-50"
                  :disabled="!hasSelection || !selectedTargetListId || actionLoading"
                  @click="copySelectedSubscribers"
              >
                <BaseIcon name="copy" class="w-3.5 h-3.5" />
                Copy Selected
              </button>

              <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50"
                  :disabled="!hasSelection || !selectedTargetListId || actionLoading"
                  @click="moveSelectedSubscribers"
              >
                <BaseIcon name="start" class="w-3.5 h-3.5" />
                Move Selected
              </button>
            </div>
          </div>

          <p v-if="actionError" class="mt-3 text-sm text-red-600">{{ actionError }}</p>
          <p v-if="actionMessage" class="mt-3 text-sm text-emerald-700">{{ actionMessage }}</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm hidden md:table">
            <thead class="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th class="px-4 py-4 w-10">
                <input
                    ref="selectAllCheckbox"
                    type="checkbox"
                    class="w-4 h-4 rounded border-slate-300"
                    :checked="allVisibleSelected"
                    :disabled="filteredSubscribers.length === 0"
                    @change="toggleSelectAllVisible"
                >
              </th>
              <th class="px-6 py-4">ID</th>
              <th class="px-6 py-4">Email</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Created</th>
              <th class="px-6 py-4 text-right">Actions</th>
            </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
            <tr v-if="loading">
              <td colspan="6" class="px-6 py-8 text-center text-slate-500">Loading...</td>
            </tr>

            <tr v-else-if="errorMessage">
              <td colspan="6" class="px-6 py-8 text-center text-red-600">{{ errorMessage }}</td>
            </tr>

            <tr
                v-for="subscriber in filteredSubscribers"
                v-else
                :key="subscriber.id"
                class="hover:bg-slate-50 transition-colors"
            >
              <td class="px-4 py-4">
                <input
                    v-model="selectedIds"
                    type="checkbox"
                    class="w-4 h-4 rounded border-slate-300"
                    :value="subscriber.id"
                >
              </td>
              <td class="px-6 py-4 text-slate-600">{{ subscriber.id }}</td>
              <td class="px-6 py-4 font-mono text-slate-900">{{ subscriber.email }}</td>
              <td class="px-6 py-4">
                  <span
                      class="px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="subscriber.confirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
                  >
                    {{ subscriber.confirmed ? 'Confirmed' : 'Unconfirmed' }}
                  </span>
              </td>
              <td class="px-6 py-4 text-slate-600">{{ formatDate(subscriber.createdAt) }}</td>
              <td class="px-6 py-4 text-right">
                <button
                    type="button"
                    class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    :disabled="actionLoading"
                    @click="deleteSingleSubscriber(subscriber)"
                >
                  <BaseIcon name="delete" class="w-3.5 h-3.5" />
                  Delete
                </button>
              </td>
            </tr>

            <tr v-if="!loading && !errorMessage && filteredSubscribers.length === 0">
              <td colspan="6" class="px-6 py-8 text-center text-slate-500">No subscribers for this filter.</td>
            </tr>
            </tbody>
          </table>

          <div class="block md:hidden divide-y divide-slate-100">
            <div v-if="loading" class="px-4 py-8 text-center text-slate-500 text-sm">Loading...</div>
            <div v-else-if="errorMessage" class="px-4 py-8 text-center text-red-600 text-sm">{{ errorMessage }}</div>

            <div class="p-4 border-b border-slate-100" v-if="!loading && !errorMessage && filteredSubscribers.length">
              <label class="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                    type="checkbox"
                    class="w-4 h-4 rounded border-slate-300"
                    :checked="allVisibleSelected"
                    @change="toggleSelectAllVisible"
                >
                Select all visible
              </label>
            </div>

            <div
                v-for="subscriber in filteredSubscribers"
                :key="`mobile-${subscriber.id}`"
                class="p-4"
            >
              <div class="flex items-start gap-3">
                <input
                    v-model="selectedIds"
                    type="checkbox"
                    class="mt-1 w-4 h-4 rounded border-slate-300"
                    :value="subscriber.id"
                >

                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-sm font-medium text-slate-900 truncate">{{ subscriber.email }}</p>
                    <span
                        class="px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                        :class="subscriber.confirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
                    >
                      {{ subscriber.confirmed ? 'Confirmed' : 'Unconfirmed' }}
                    </span>
                  </div>
                  <p class="mt-2 text-xs text-slate-500">#{{ subscriber.id }} · {{formatDate(subscriber.createdAt) }}</p>
                  <button
                      type="button"
                      class="mt-3 inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      :disabled="actionLoading"
                      @click="deleteSingleSubscriber(subscriber)"
                  >
                    <BaseIcon name="delete" class="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>

            <div
                v-if="!loading && !errorMessage && filteredSubscribers.length === 0"
                class="px-4 py-8 text-center text-slate-500 text-sm"
            >
              No subscribers for this filter.
            </div>
          </div>
        </div>

        <div
            class="p-4 sm:p-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-sm">
          <span class="text-slate-500">Showing {{ filteredSubscribers.length }} on page · Total: {{ total }}</span>
          <div class="flex gap-2 w-full sm:w-auto">
            <button
                type="button"
                class="flex-1 sm:flex-none px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                :disabled="!canGoPrevious || loading || actionLoading"
                @click="previousPage"
            >
              Previous
            </button>
            <button
                type="button"
                class="flex-1 sm:flex-none px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                :disabled="!canGoNext || loading || actionLoading"
                @click="nextPage"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <ListSubscribersExportPanel :list-id="listId" :list-name="listName"/>

    </div>
  </AdminLayout>
</template>

<script setup>
import {computed, onMounted, ref, watch, watchEffect} from 'vue'
import {useRoute} from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import ListSubscribersExportPanel from '../components/lists/ListSubscribersExportPanel.vue'
import BaseIcon from '../components/base/BaseIcon.vue'
import client, {subscriptionClient} from '../api'

const route = useRoute()
const listId = computed(() => Number(route.params.listId))
const listName = ref(typeof route.query.listName === 'string' ? route.query.listName : '')

const subscribers = ref([])
const total = ref(0)
const pageSize = ref(10)
const loading = ref(false)
const actionLoading = ref(false)
const errorMessage = ref('')
const actionError = ref('')
const actionMessage = ref('')
const nextCursor = ref(null)
const cursorHistory = ref([null])
const statusFilter = ref('all')
const selectedIds = ref([])
const selectedTargetListId = ref('')
const availableLists = ref([])
const selectAllCheckbox = ref(null)

const filteredSubscribers = computed(() => {
  if (statusFilter.value === 'confirmed') {
    return subscribers.value.filter((subscriber) => subscriber.confirmed)
  }

  if (statusFilter.value === 'unconfirmed') {
    return subscribers.value.filter((subscriber) => !subscriber.confirmed)
  }

  return subscribers.value
})

const selectedSubscribers = computed(() => (
    subscribers.value.filter((subscriber) => selectedIds.value.includes(subscriber.id))
))

const hasSelection = computed(() => selectedSubscribers.value.length > 0)
const canGoPrevious = computed(() => cursorHistory.value.length > 1)
const canGoNext = computed(() => nextCursor.value !== null)

const allVisibleSelected = computed(() => {
  if (filteredSubscribers.value.length === 0) return false
  return filteredSubscribers.value.every((subscriber) => selectedIds.value.includes(subscriber.id))
})

const someVisibleSelected = computed(() => {
  if (filteredSubscribers.value.length === 0) return false
  return filteredSubscribers.value.some((subscriber) => selectedIds.value.includes(subscriber.id))
})

watchEffect(() => {
  if (!selectAllCheckbox.value) return
  selectAllCheckbox.value.indeterminate = !allVisibleSelected.value && someVisibleSelected.value
})

watch(statusFilter, () => {
  actionError.value = ''
  actionMessage.value = ''
})

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString()
}

const clearSelection = () => {
  selectedIds.value = []
}

const getCurrentCursor = () => cursorHistory.value[cursorHistory.value.length - 1]

const toggleSelectAllVisible = (event) => {
  const visibleIds = filteredSubscribers.value.map((subscriber) => subscriber.id)

  if (event.target.checked) {
    const merged = new Set([...selectedIds.value, ...visibleIds])
    selectedIds.value = Array.from(merged)
    return
  }

  const visibleSet = new Set(visibleIds)
  selectedIds.value = selectedIds.value.filter((id) => !visibleSet.has(id))
}

const getSelectedEmails = () => selectedSubscribers.value
    .map((subscriber) => subscriber.email)
    .filter((email) => typeof email === 'string' && email.length > 0)

const loadListMeta = async () => {
  try {
    const list = await subscriptionClient.getSubscriberList(listId.value)
    if (list?.name) {
      listName.value = list.name
    }
  } catch (error) {
    console.error('Failed to load list metadata:', error)
  }
}

const loadAvailableLists = async () => {
  const lists = []
  let cursor = null

  try {
    while (true) {
      const response = await subscriptionClient.getSubscriberLists(cursor, 100)
      const items = Array.isArray(response.items) ? response.items : []

      for (const list of items) {
        if (list.id !== listId.value) {
          lists.push(list)
        }
      }

      if (!response.pagination?.hasMore || response.pagination?.nextCursor == null) {
        break
      }

      cursor = response.pagination.nextCursor
    }
  } catch (error) {
    console.error('Failed to load available lists:', error)
  }

  availableLists.value = lists
}

const fetchSubscribers = async (cursor = null) => {
  if (!Number.isInteger(listId.value) || listId.value <= 0) {
    errorMessage.value = 'Invalid list ID.'
    subscribers.value = []
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await subscriptionClient.getSubscribersOfList(listId.value, cursor, pageSize.value)
    subscribers.value = Array.isArray(response.items) ? response.items : []
    total.value = response.pagination?.total ?? subscribers.value.length
    nextCursor.value = response.pagination?.nextCursor ?? null
    clearSelection()
    return true
  } catch (error) {
    console.error('Failed to load list subscribers:', error)
    errorMessage.value = 'Failed to load subscribers for this list.'
    subscribers.value = []
    nextCursor.value = null
    clearSelection()
    return false
  } finally {
    loading.value = false
  }
}

const refreshCurrentPage = async () => {
  await fetchSubscribers(getCurrentCursor())
}

const deleteEmailsFromCurrentList = async (emails) => {
  if (emails.length === 0) return
  // todo: check why subscription client delete is not working
  await client.delete(`lists/${listId.value}/subscribers`, {emails})
}

const deleteSingleSubscriber = async (subscriber) => {
  if (!subscriber?.email) return

  actionError.value = ''
  actionMessage.value = ''

  const confirmed = window.confirm(`Remove ${subscriber.email} from this list?`)
  if (!confirmed) return

  actionLoading.value = true
  try {
    await deleteEmailsFromCurrentList([subscriber.email])
    actionMessage.value = 'Subscriber removed from this list.'
    await refreshCurrentPage()
  } catch (error) {
    console.error('Failed to delete subscriber from list:', error)
    actionError.value = 'Failed to remove subscriber from this list.'
  } finally {
    actionLoading.value = false
  }
}

const deleteSelectedSubscribers = async () => {
  const emails = getSelectedEmails()
  if (emails.length === 0) return

  actionError.value = ''
  actionMessage.value = ''

  const confirmed = window.confirm(`Remove ${emails.length} selected subscriber(s) from this list?`)
  if (!confirmed) return

  actionLoading.value = true
  try {
    await deleteEmailsFromCurrentList(emails)
    actionMessage.value = `Removed ${emails.length} subscriber(s) from this list.`
    await refreshCurrentPage()
  } catch (error) {
    console.error('Failed to delete selected subscribers from list:', error)
    actionError.value = 'Failed to remove selected subscribers from this list.'
  } finally {
    actionLoading.value = false
  }
}

const copySelectedSubscribers = async () => {
  const emails = getSelectedEmails()
  const targetListId = Number(selectedTargetListId.value)

  if (emails.length === 0 || !Number.isInteger(targetListId) || targetListId <= 0) return

  actionError.value = ''
  actionMessage.value = ''

  actionLoading.value = true
  try {
    await subscriptionClient.createSubscriptions(emails, targetListId)
    actionMessage.value = `Copied ${emails.length} subscriber(s) to the selected list.`
  } catch (error) {
    console.error('Failed to copy selected subscribers:', error)
    actionError.value = 'Failed to copy selected subscribers.'
  } finally {
    actionLoading.value = false
  }
}

const moveSelectedSubscribers = async () => {
  const emails = getSelectedEmails()
  const targetListId = Number(selectedTargetListId.value)

  if (emails.length === 0 || !Number.isInteger(targetListId) || targetListId <= 0) return

  actionError.value = ''
  actionMessage.value = ''

  const confirmed = window.confirm(`Move ${emails.length} selected subscriber(s) to the selected list?`)
  if (!confirmed) return

  actionLoading.value = true
  let copied = false

  try {
    await subscriptionClient.createSubscriptions(emails, targetListId)
    copied = true

    await deleteEmailsFromCurrentList(emails)

    actionMessage.value = `Moved ${emails.length} subscriber(s) to the selected list.`
    selectedTargetListId.value = ''
    await refreshCurrentPage()
  } catch (error) {
    console.error('Failed to move selected subscribers:', error)

    if (copied) {
      actionError.value =
          `Copied ${emails.length} subscriber(s) to the selected list, ` +
          `but failed to remove them from the current list. ` +
          `They may now exist in both lists.`
      await refreshCurrentPage()
    } else {
      actionError.value = 'Failed to move selected subscribers.'
    }
  } finally {
    actionLoading.value = false
  }
}

const nextPage = async () => {
  if (nextCursor.value === null || loading.value || actionLoading.value) return

  const requestedCursor = nextCursor.value
  const ok = await fetchSubscribers(requestedCursor)
  if (ok) {
    cursorHistory.value.push(requestedCursor)
  }
}

const previousPage = async () => {
  if (cursorHistory.value.length <= 1 || loading.value || actionLoading.value) return

  const previousCursor = cursorHistory.value[cursorHistory.value.length - 2]
  const ok = await fetchSubscribers(previousCursor)
  if (ok) {
    cursorHistory.value.pop()
  }
}

onMounted(async () => {
  await Promise.all([
    loadListMeta(),
    loadAvailableLists(),
    fetchSubscribers(getCurrentCursor())
  ])
})
</script>
