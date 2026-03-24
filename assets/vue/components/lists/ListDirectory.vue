<template>
  <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <div class="p-4 sm:p-6 border-b border-slate-200 flex justify-between items-center">
      <h2 class="text-xl font-bold text-slate-900">Mailing Lists</h2>

      <button
        type="button"
        class="inline-flex shrink-0 items-center gap-2 whitespace-nowrap min-w-max px-4 py-2 bg-ext-wf1 text-white text-xs font-bold rounded-lg hover:bg-ext-wf3 transition-shadow shadow-sm shadow-indigo-500/20"
        @click="openCreateModal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"></path>
          <path d="M12 5v14"></path>
        </svg>
        Add new list
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm hidden md:table">
        <thead class="bg-slate-50 text-slate-500 font-medium">
        <tr>
          <th class="px-6 py-4">ID</th>
          <th class="px-6 py-4">Name</th>
          <th class="px-6 py-4">Public/Active</th>
          <th class="px-6 py-4 text-right">Actions</th>
        </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
        <tr
            v-for="list in mailingLists"
            :key="list.id"
            class="hover:bg-slate-50 transition-colors"
        >
          <td class="px-6 py-4 text-slate-600">{{ list.id }}</td>
          <td class="px-6 py-4 font-medium text-slate-900">{{ list.name }}</td>
          <td class="px-6 py-4">
              <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="isPublic(list) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'"
              >
                {{ isPublic(list) ? 'Yes' : 'No' }}
              </span>
          </td>
          <td class="px-6 py-4">
            <div class="flex flex-wrap justify-end gap-2">
              <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  @click="handleDelete(list)"
              >
                <BaseIcon name="delete" class="w-3.5 h-3.5" />
                Delete
              </button>

              <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors"
                  @click="handleAddSubscriber(list)"
              >
                <BaseIcon name="addUser" class="w-3.5 h-3.5" />
                Add Subscribers
              </button>

              <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                  @click="handleEdit(list)"
              >
                <BaseIcon name="edit" class="w-3.5 h-3.5" />
                Edit
              </button>

              <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
                  @click="handleStartCampaign(list)"
              >
                <BaseIcon name="plane" class="w-3.5 h-3.5" />
                Start Campaign
              </button>

              <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                  @click="handleViewMembers(list)"
              >
                <BaseIcon name="eye" class="w-3.5 h-3.5" />
                View Members
              </button>
            </div>
          </td>
        </tr>

        <tr v-if="mailingLists.length === 0">
          <td colspan="4" class="px-6 py-8 text-center text-slate-500">
            No mailing lists found.
          </td>
        </tr>
        </tbody>
      </table>

      <div class="block md:hidden divide-y divide-slate-100">
        <div
            v-for="list in mailingLists"
            :key="`mobile-${list.id}`"
            class="p-4 space-y-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-500">#{{ list.id }}</p>
              <p class="font-semibold text-slate-900">{{ list.name }}</p>
            </div>

            <span
                class="px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                :class="isPublic(list) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'"
            >
              {{ isPublic(list) ? 'Public' : 'Private' }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button
                type="button"
                class="px-2.5 py-2 text-xs font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                @click="handleDelete(list)"
            >
              Delete
            </button>

            <button
                type="button"
                class="px-2.5 py-2 text-xs font-medium rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors"
                @click="handleAddSubscriber(list)"
            >
              Add Subscriber
            </button>

            <button
                type="button"
                class="px-2.5 py-2 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                @click="handleEdit(list)"
            >
              Edit
            </button>

            <button
                type="button"
                class="px-2.5 py-2 text-xs font-medium rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
                @click="handleStartCampaign(list)"
            >
              Start Campaign
            </button>

            <button
                type="button"
                class="col-span-2 px-2.5 py-2 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                @click="handleViewMembers(list)"
            >
              View Members
            </button>
          </div>
        </div>

        <div
            v-if="mailingLists.length === 0"
            class="px-4 py-8 text-center text-slate-500 text-sm"
        >
          No mailing lists found.
        </div>
      </div>
    </div>
  </div>

  <CreateListModal
      :is-open="isCreateModalOpen"
      @close="closeCreateModal"
      @created="handleListCreated"
  />

  <EditListModal
      :is-open="isEditModalOpen"
      :list="selectedList"
      @close="closeEditModal"
      @updated="handleListUpdated"
  />

  <AddSubscribersModal
      :is-open="isAddSubscribersModalOpen"
      :list="selectedList"
      @close="closeAddSubscribersModal"
      @added="handleSubscribersAdded"
  />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import BaseIcon from '../base/BaseIcon.vue'
import CreateListModal from './CreateListModal.vue'
import EditListModal from './EditListModal.vue'
import AddSubscribersModal from './AddSubscribersModal.vue'

import { listClient } from '../../api'

const mailingLists = ref([])
const isCreateModalOpen = ref(false)

const selectedList = ref(null)
const isEditModalOpen = ref(false)
const isAddSubscribersModalOpen = ref(false)

const fetchMailingLists = async () => {
  const url = new URL('/lists', window.location.origin)

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })

    if (response.status === 401) {
      const data = await response.json()
      window.location.href = data.redirect
      return
    }

    const data = await response.json()
    mailingLists.value = Array.isArray(data?.items) ? data.items : []
  } catch (error) {
    console.error('Failed to fetch mailing lists:', error)
    mailingLists.value = []
  }
}

onMounted(() => {
  fetchMailingLists()
})

const emit = defineEmits([
  'delete',
  'add-subscriber',
  'edit',
  'start-campaign',
  'view-members'
])

const handleDelete = async (list) => {
  const confirmed = window.confirm(
      `Delete mailing list "${list.name}"?\n\nThis action cannot be undone.`
  )

  if (!confirmed) return

  try {
    await listClient.deleteList(list.id)
    await fetchMailingLists()
  } catch (e) {
    console.error('Delete failed', e)
  }
}

const handleAddSubscriber = (list) => {
  selectedList.value = list
  isAddSubscribersModalOpen.value = true
  emit('add-subscriber', list)
}

const closeAddSubscribersModal = () => {
  isAddSubscribersModalOpen.value = false
  selectedList.value = null
}

const handleSubscribersAdded = async () => {
  await fetchMailingLists()
}

const handleEdit = (list) => {
  selectedList.value = list
  isEditModalOpen.value = true
  emit('edit', list)
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  selectedList.value = null
}

const handleListUpdated = async () => {
  await fetchMailingLists()
}

const handleStartCampaign = (list) => emit('start-campaign', list)
const handleViewMembers = (list) => emit('view-members', list)

const isPublic = (list) =>
    list?.public === true || list?.public === 1 || list?.public === '1'

const openCreateModal = () => {
  isCreateModalOpen.value = true
}

const closeCreateModal = () => {
  isCreateModalOpen.value = false
}

const handleListCreated = async () => {
  await fetchMailingLists()
}
</script>
