<template>
  <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <div class="p-4 sm:p-6 border-b border-slate-200 flex justify-between items-center">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Administrators</h2>
        <p class="mt-0.5 text-sm text-slate-500">Manage administrator accounts and permissions</p>
      </div>

      <button
        type="button"
        class="inline-flex shrink-0 items-center gap-2 whitespace-nowrap min-w-max px-4 py-2 bg-ext-wf1 text-white text-xs font-bold rounded-lg hover:bg-ext-wf3 transition-shadow shadow-sm shadow-indigo-500/20"
        @click="openCreateModal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14"></path>
          <path d="M12 5v14"></path>
        </svg>
        Add Admin
      </button>
    </div>

    <div class="overflow-x-auto">
      <!-- Desktop Table View -->
      <table class="w-full text-left text-sm hidden md:table">
        <thead class="bg-slate-50 text-slate-500 font-medium">
          <tr>
            <th class="px-6 py-4">ID</th>
            <th class="px-6 py-4">Login Name</th>
            <th class="px-6 py-4">Email</th>
            <th class="px-6 py-4">Super User</th>
            <th class="px-6 py-4">Created</th>
            <th class="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr
            v-for="admin in admins"
            :key="admin.id"
            class="hover:bg-slate-50 transition-colors"
          >
            <td class="px-6 py-4 text-slate-600">{{ admin.id }}</td>
            <td class="px-6 py-4 font-medium text-slate-900">{{ admin.loginName }}</td>
            <td class="px-6 py-4 text-slate-600">{{ admin.email }}</td>
            <td class="px-6 py-4">
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="admin.superUser ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'"
              >
                {{ admin.superUser ? 'Yes' : 'No' }}
              </span>
            </td>
            <td class="px-6 py-4 text-slate-600 text-xs">
              {{ formatDate(admin.createdAt) }}
            </td>
            <td class="px-6 py-4">
              <div class="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                  @click="handleEdit(admin)"
                >
                  <BaseIcon name="edit" class="w-3.5 h-3.5" />
                  Edit
                </button>

                <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  @click="handleDelete(admin)"
                >
                  <BaseIcon name="delete" class="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!isLoading && !loadError && admins.length === 0">
            <td colspan="6" class="px-6 py-8 text-center text-slate-500">
              No administrators found. Create one to get started.
            </td>
          </tr>
          <tr v-if="isLoading">
            <td colspan="6" class="px-6 py-8 text-center text-slate-500">
              Loading administrators...
            </td>
          </tr>

          <tr v-else-if="loadError">
            <td colspan="6" class="px-6 py-8 text-center text-red-600">
              {{ loadError }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Mobile Card View -->
      <div class="block md:hidden divide-y divide-slate-100">
        <div
          v-for="admin in admins"
          :key="`mobile-${admin.id}`"
          class="p-4 space-y-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-500">#{{ admin.id }}</p>
              <p class="font-semibold text-slate-900">{{ admin.loginName }}</p>
              <p class="text-sm text-slate-500">{{ admin.email }}</p>
            </div>

            <span
              class="px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
              :class="admin.superUser ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'"
            >
              {{ admin.superUser ? 'Super' : 'User' }}
            </span>
          </div>

          <p class="text-xs text-slate-500">
            Created: {{ formatDate(admin.createdAt) }}
          </p>

          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              @click="handleEdit(admin)"
            >
              <BaseIcon name="edit" class="w-3.5 h-3.5" />
              Edit
            </button>

            <button
              type="button"
              class="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              @click="handleDelete(admin)"
            >
              <BaseIcon name="delete" class="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>

        <div v-if="isLoading" class="px-4 py-8 text-center text-slate-500 text-sm">
          Loading administrators...
        </div>

        <div v-else-if="loadError" class="px-4 py-8 text-center text-red-600 text-sm">
          {{ loadError }}
        </div>

        <div v-else-if="admins.length === 0" class="px-4 py-8 text-center text-slate-500 text-sm">
          No administrators found. Create one to get started.
        </div>
      </div>
    </div>
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
import BaseIcon from "../base/BaseIcon.vue";

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
