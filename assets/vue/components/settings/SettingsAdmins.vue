<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
    <div class="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
      <div>
        <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">Administrators</h2>
        <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Manage administrator accounts and permissions</p>
      </div>

      <BaseButton variant="accent" icon="plus" @click="openCreateModal">
        Add Admin
      </BaseButton>
    </div>

    <BaseDataTable
        :items="admins"
        :is-loading="isLoading"
        :load-error="loadError"
        loading-message="Loading administrators..."
        empty-message="No administrators found. Create one to get started."
        :colspan="6"
    >
      <template #head>
        <th class="px-6 py-4">ID</th>
        <th class="px-6 py-4">Login Name</th>
        <th class="px-6 py-4">Email</th>
        <th class="px-6 py-4">Super User</th>
        <th class="px-6 py-4">Created</th>
        <th class="px-6 py-4 text-right">Actions</th>
      </template>

      <template #row="{ item: admin }">
        <td class="px-6 py-4 text-slate-600 dark:text-slate-300">{{ admin.id }}</td>
        <td class="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{{ admin.loginName }}</td>
        <td class="px-6 py-4 text-slate-600 dark:text-slate-300">{{ admin.email }}</td>
        <td class="px-6 py-4">
          <BaseBadge :variant="admin.superUser ? 'info' : 'neutral'">
            {{ admin.superUser ? 'Yes' : 'No' }}
          </BaseBadge>
        </td>
        <td class="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs">
          {{ formatDate(admin.createdAt) }}
        </td>
        <td class="px-6 py-4">
          <div class="flex flex-wrap justify-end gap-2">
            <ActionButton icon="edit" @click="handleEdit(admin)">
              Edit
            </ActionButton>

            <ActionButton variant="danger" icon="delete" @click="handleDelete(admin)">
              Delete
            </ActionButton>
          </div>
        </td>
      </template>

      <template #card="{ item: admin }">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">#{{ admin.id }}</p>
            <p class="font-semibold text-slate-900 dark:text-slate-100">{{ admin.loginName }}</p>
            <p class="text-sm text-slate-500 dark:text-slate-400">{{ admin.email }}</p>
          </div>

          <BaseBadge class="whitespace-nowrap" :variant="admin.superUser ? 'info' : 'neutral'">
            {{ admin.superUser ? 'Super' : 'User' }}
          </BaseBadge>
        </div>

        <p class="text-xs text-slate-500 dark:text-slate-400">
          Created: {{ formatDate(admin.createdAt) }}
        </p>

        <div class="grid grid-cols-2 gap-2">
          <ActionButton block icon="edit" @click="handleEdit(admin)">
            Edit
          </ActionButton>

          <ActionButton block variant="danger" icon="delete" @click="handleDelete(admin)">
            Delete
          </ActionButton>
        </div>
      </template>
    </BaseDataTable>
  </div>

  <!-- Create Admin Modal -->
  <CreateAdminModal
    :is-open="isCreateModalOpen"
    @close="closeCreateModal"
    @created="handleAdminCreated"
  />

  <!-- Edit Admin Modal -->
  <EditAdminModal
    :is-open="isEditModalOpen"
    :admin="selectedAdmin"
    @close="closeEditModal"
    @updated="handleAdminUpdated"
  />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import CreateAdminModal from './CreateAdminModal.vue'
import EditAdminModal from './EditAdminModal.vue'
import { fetchAllAdmins, adminClient } from '../../api'
import BaseButton from "../base/BaseButton.vue";
import BaseBadge from "../base/BaseBadge.vue";
import ActionButton from "../base/ActionButton.vue";
import BaseDataTable from "../base/BaseDataTable.vue";

const admins = ref([])
const isLoading = ref(false)
const loadError = ref('')
const isCreateModalOpen = ref(false)
const selectedAdmin = ref(null)
const isEditModalOpen = ref(false)

const fetchAdmins = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    admins.value = await fetchAllAdmins()
  } catch (error) {
    console.error('Failed to fetch administrators:', error)
    admins.value = []
    loadError.value = error?.message || 'Failed to load administrators.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchAdmins()
})

const handleDelete = async (admin) => {
  const confirmed = window.confirm(
    `Delete administrator "${admin.loginName}"?\n\nThis action cannot be undone.`
  )

  if (!confirmed) return

  try {
    await adminClient.deleteAdministrator(admin.id)
    await fetchAdmins()
  } catch (e) {
    console.error('Delete failed', e)
    alert('Failed to delete administrator: ' + (e?.message || 'Unknown error'))
  }
}

const handleEdit = (admin) => {
  selectedAdmin.value = admin
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  selectedAdmin.value = null
}

const handleAdminUpdated = async () => {
  await fetchAdmins()
}

const openCreateModal = () => {
  isCreateModalOpen.value = true
}

const closeCreateModal = () => {
  isCreateModalOpen.value = false
}

const handleAdminCreated = async () => {
  await fetchAdmins()
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}
</script>
