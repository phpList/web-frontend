<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
    <div class="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
      <div>
        <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">
          Admin Attributes
        </h2>

        <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          Manage administrator attribute definitions
        </p>
      </div>

      <button
          type="button"
          class="inline-flex shrink-0 items-center gap-2 whitespace-nowrap min-w-max px-4 py-2 bg-ext-wf1 text-white text-xs font-bold rounded-lg hover:bg-ext-wf3 transition-shadow shadow-sm shadow-indigo-500/20"
          @click="openCreateModal"
      >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
          <path d="M5 12h14"/>
          <path d="M12 5v14"/>
        </svg>

        Add Attribute
      </button>
    </div>

    <div class="overflow-x-auto">

      <!-- Desktop -->

      <table class="w-full text-left text-sm hidden md:table">
        <thead class="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">
        <tr>
          <th class="px-6 py-4">ID</th>
          <th class="px-6 py-4">Name</th>
          <th class="px-6 py-4">Type</th>
          <th class="px-6 py-4">Required</th>
          <th class="px-6 py-4 text-right">Actions</th>
        </tr>
        </thead>

        <tbody class="divide-y divide-slate-200 dark:divide-slate-700">

        <tr
            v-for="attribute in attributes"
            :key="attribute.id"
            class="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <td class="px-6 py-4 text-slate-600 dark:text-slate-300">
            {{ attribute.id }}
          </td>

          <td class="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
            {{ attribute.name }}
          </td>

          <td class="px-6 py-4 text-slate-600 dark:text-slate-300">
            {{ attribute.type === 'textline' ? 'Text' : attribute.type === 'hidden' ? 'Hidden' : attribute.type }}
          </td>

          <td class="px-6 py-4">
            <span
                class="px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="attribute.required
                ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'"
            >
              {{ attribute.required ? 'Required' : 'Optional' }}
            </span>
          </td>

          <td class="px-6 py-4">
            <div class="flex justify-end gap-2">

              <button
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                  @click="handleEdit(attribute)"
              >
                <BaseIcon name="edit" class="w-3.5 h-3.5"/>
                Edit
              </button>

              <button
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                  @click="handleDelete(attribute)"
              >
                <BaseIcon name="delete" class="w-3.5 h-3.5"/>
                Delete
              </button>

            </div>
          </td>
        </tr>

        <tr v-if="!isLoading && !loadError && attributes.length===0">
          <td colspan="5" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
            No attributes found.
          </td>
        </tr>

        <tr v-if="isLoading">
          <td colspan="5" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
            Loading attributes...
          </td>
        </tr>

        <tr v-else-if="loadError">
          <td colspan="5" class="px-6 py-8 text-center text-red-600 dark:text-red-400">
            {{ loadError }}
          </td>
        </tr>

        </tbody>
      </table>

      <!-- Mobile -->

      <div class="block md:hidden divide-y divide-slate-100 dark:divide-slate-700">

        <div
            v-for="attribute in attributes"
            :key="attribute.id"
            class="p-4 space-y-3"
        >
          <div class="flex justify-between items-start">

            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                #{{ attribute.id }}
              </p>

              <p class="font-semibold text-slate-900 dark:text-slate-100">
                {{ attribute.name }}
              </p>

              <p class="text-sm text-slate-500 dark:text-slate-400">
                {{ attribute.type === 'textline' ? 'Text' : attribute.type === 'hidden' ? 'Hidden' : attribute.type }}
              </p>
            </div>

            <span
                class="px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="attribute.required
                ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'"
            >
              {{ attribute.required ? 'Required' : 'Optional' }}
            </span>

          </div>

          <div class="grid grid-cols-2 gap-2">

            <button
                class="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200"
                @click="handleEdit(attribute)"
            >
              <BaseIcon name="edit" class="w-3.5 h-3.5"/>
              Edit
            </button>

            <button
                class="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400"
                @click="handleDelete(attribute)"
            >
              <BaseIcon name="delete" class="w-3.5 h-3.5"/>
              Delete
            </button>

          </div>
        </div>

        <div
            v-if="isLoading"
            class="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
        >
          Loading attributes...
        </div>

        <div
            v-else-if="loadError"
            class="px-4 py-8 text-center text-red-600 dark:text-red-400"
        >
          {{ loadError }}
        </div>

        <div
            v-else-if="attributes.length===0"
            class="px-4 py-8 text-center text-slate-500 dark:text-slate-400"
        >
          No attributes found.
        </div>

      </div>

    </div>
  </div>

  <CreateAdminAttributeModal
      :is-open="isCreateModalOpen"
      @close="closeCreateModal"
      @created="handleCreated"
  />

  <EditAdminAttributeModal
      :is-open="isEditModalOpen"
      :attribute="selectedAttribute"
      @close="closeEditModal"
      @updated="handleUpdated"
  />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import BaseIcon from '../base/BaseIcon.vue'

import CreateAdminAttributeModal from './CreateAdminAttributeModal.vue'
import EditAdminAttributeModal from './EditAdminAttributeModal.vue'

import { adminAttributeClient } from '../../api'

const attributes = ref([])

const isLoading = ref(false)
const loadError = ref('')

const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)

const selectedAttribute = ref(null)

const fetchAttributes = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const result = await adminAttributeClient.getAttributeDefinitions()
    attributes.value = result.items ?? result.data ?? []
  } catch (e) {
    console.error(e)
    loadError.value = e?.message || 'Failed to load attributes.'
    attributes.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchAttributes)

const openCreateModal = () => {
  isCreateModalOpen.value = true
}

const closeCreateModal = () => {
  isCreateModalOpen.value = false
}

const handleCreated = async () => {
  closeCreateModal()
  await fetchAttributes()
}

const handleEdit = (attribute) => {
  selectedAttribute.value = attribute
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  selectedAttribute.value = null
  isEditModalOpen.value = false
}

const handleUpdated = async () => {
  closeEditModal()
  await fetchAttributes()
}

const handleDelete = async (attribute) => {
  const confirmed = window.confirm(
      `Delete attribute "${attribute.name}"?\n\nThis action cannot be undone.`
  )

  if (!confirmed) return

  try {
    await adminAttributeClient.deleteAttributeDefinition(attribute.id)
    await fetchAttributes()
  } catch (e) {
    console.error(e)
    alert(e?.message || 'Failed to delete attribute.')
  }
}
</script>
