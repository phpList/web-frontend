<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
    <div class="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
      <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">Mailing Lists</h2>

      <button
        type="button"
        class="inline-flex shrink-0 items-center gap-2 whitespace-nowrap min-w-max px-4 py-2 bg-ext-wf1 text-white text-xs font-bold rounded-lg hover:bg-ext-wf3 transition-shadow shadow-sm shadow-indigo-500/20"
        @click="openCreateModal"
      >
        <BaseIcon name="plus" class="w-3.5 h-3.5" inherit-color />
        Add new list
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm hidden md:table">
        <thead class="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">
        <tr>
          <th class="px-6 py-4">ID</th>
          <th class="px-6 py-4">Name</th>
          <th class="px-6 py-4">Public/Active</th>
          <th class="px-6 py-4 text-right">Actions</th>
        </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
        <tr
            v-for="list in mailingLists"
            :key="list.id"
            class="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <td class="px-6 py-4 text-slate-600 dark:text-slate-300">{{ list.id }}</td>
          <td class="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{{ list.name }}</td>
          <td class="px-6 py-4">
              <BaseBadge :variant="isPublic(list) ? 'success' : 'neutral'">
                {{ isPublic(list) ? 'Yes' : 'No' }}
              </BaseBadge>
          </td>
          <td class="px-6 py-4">
            <div class="flex flex-wrap justify-end gap-2">
              <ActionButton variant="danger" icon="delete" @click="handleDelete(list)">
                Delete
              </ActionButton>

              <ActionButton variant="success" icon="addUser" @click="handleAddSubscriber(list)">
                Add Subscribers
              </ActionButton>

              <ActionButton icon="edit" @click="handleEdit(list)">
                Edit
              </ActionButton>

              <ActionButton variant="info" icon="plane" @click="handleStartCampaign(list)">
                Start Campaign
              </ActionButton>

              <ActionButton icon="eye" @click="handleViewMembers(list)">
                View Members
              </ActionButton>
            </div>
          </td>
        </tr>

        <tr v-if="!isLoading && !loadError && mailingLists.length === 0">
          <td colspan="4" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
            No mailing lists found.
          </td>
        </tr>
        <tr v-if="isLoading">
          <td colspan="4" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
            Loading mailing lists...
          </td>
        </tr>

        <tr v-else-if="loadError">
          <td colspan="4" class="px-6 py-8 text-center text-red-600 dark:text-red-400">
            {{ loadError }}
          </td>
        </tr>

        <tr v-else-if="mailingLists.length === 0">
          <td colspan="4" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
            No mailing lists found.
          </td>
        </tr>
        </tbody>
      </table>

      <div class="block md:hidden divide-y divide-slate-100 dark:divide-slate-700">
        <div
            v-for="list in mailingLists"
            :key="`mobile-${list.id}`"
            class="p-4 space-y-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">#{{ list.id }}</p>
              <p class="font-semibold text-slate-900 dark:text-slate-100">{{ list.name }}</p>
            </div>

            <BaseBadge class="whitespace-nowrap" :variant="isPublic(list) ? 'success' : 'neutral'">
              {{ isPublic(list) ? 'Public' : 'Private' }}
            </BaseBadge>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <ActionButton block variant="danger" icon="delete" @click="handleDelete(list)">
              Delete
            </ActionButton>

            <ActionButton block variant="success" icon="addUser" @click="handleAddSubscriber(list)">
              Add Subscriber
            </ActionButton>

            <ActionButton block icon="edit" @click="handleEdit(list)">
              Edit
            </ActionButton>

            <ActionButton block variant="info" icon="plane" @click="handleStartCampaign(list)">
              Start Campaign
            </ActionButton>

            <ActionButton block class="col-span-2" icon="eye" @click="handleViewMembers(list)">
              View Members
            </ActionButton>
          </div>
        </div>

        <div
            v-if="isLoading"
            class="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm"
        >
          Loading mailing lists...
        </div>

        <div
            v-else-if="loadError"
            class="px-4 py-8 text-center text-red-600 dark:text-red-400 text-sm"
        >
          {{ loadError }}
        </div>

        <div
            v-else-if="mailingLists.length === 0"
            class="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm"
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
import { useRouter } from 'vue-router'
import BaseIcon from '../base/BaseIcon.vue'
import BaseBadge from '../base/BaseBadge.vue'
import ActionButton from '../base/ActionButton.vue'
import CreateListModal from './CreateListModal.vue'
import EditListModal from './EditListModal.vue'
import AddSubscribersModal from './AddSubscribersModal.vue'
import { fetchAllLists, listClient } from '../../api'

const router = useRouter()

const mailingLists = ref([])
const isLoading = ref(false)
const loadError = ref('')
const isCreateModalOpen = ref(false)
const selectedList = ref(null)
const isEditModalOpen = ref(false)
const isAddSubscribersModalOpen = ref(false)

const fetchMailingLists = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    mailingLists.value = await fetchAllLists()
  } catch (error) {
    console.error('Failed to fetch mailing lists:', error)
    mailingLists.value = []
    loadError.value = error?.message || 'Failed to load mailing lists.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchMailingLists()
})

const emit = defineEmits([
  'delete',
  'add-subscriber',
  'edit',
  'start-campaign'
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

const handleViewMembers = (list) => {
  if (!list?.id) return

  router.push({
    name: 'list-subscribers',
    params: { listId: list.id },
    query: list.name ? { listName: list.name } : {}
  })
}

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
